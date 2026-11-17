// JScoin - Semana/Día 20: Multi-firma educativa básica
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Simula el concepto de multisig (ej. 2-de-3) a nivel de aplicación.
// No implementa scripts reales de Bitcoin (P2SH, OP_CHECKMULTISIG, etc.).

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount, fee = 0) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.fee = fee;
    this.timestamp = Date.now();
    this.signature = null;
    this.signatures = []; // Para multisig: array de firmas
    this.requiredSignatures = 1;
    this.allowedPublicKeys = []; // Claves que pueden firmar
    this.id = crypto.randomBytes(8).toString('hex');
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.fee + this.timestamp + this.id)
      .digest('hex');
  }

  // Firma normal (1-de-1)
  sign(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('No puedes firmar transacciones de otras wallets');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
    this.signatures = [this.signature];
    this.requiredSignatures = 1;
    this.allowedPublicKeys = [this.fromAddress];
  }

  // Configura como multisig (ejemplo 2-de-3)
  setupMultisig(allowedKeys, required = 2) {
    this.allowedPublicKeys = allowedKeys;
    this.requiredSignatures = required;
    this.fromAddress = 'MULTISIG-' + crypto.createHash('sha256').update(allowedKeys.join('')).digest('hex').substring(0, 16);
  }

  addSignature(signingKey) {
    const pub = signingKey.getPublic('hex');
    if (!this.allowedPublicKeys.includes(pub)) {
      throw new Error('Esta clave no está autorizada para firmar esta multisig');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    const der = sig.toDER('hex');
    if (!this.signatures.includes(der)) {
      this.signatures.push(der);
    }
  }

  isValid() {
    if (this.fromAddress === null) return true; // coinbase
    if (this.signatures.length < this.requiredSignatures) return false;

    try {
      const hashTx = this.calculateHash();
      let validCount = 0;
      for (const sig of this.signatures) {
        for (const pub of this.allowedPublicKeys) {
          const publicKey = ec.keyFromPublic(pub, 'hex');
          if (publicKey.verify(hashTx, sig)) {
            validCount++;
            break;
          }
        }
      }
      return validCount >= this.requiredSignatures && this.amount > 0 && this.fee >= 0;
    } catch (e) {
      return false;
    }
  }

  totalCost() {
    return this.amount + this.fee;
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '', difficulty = 2) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce + this.difficulty)
      .digest('hex');
  }

  mineBlock() {
    const target = '0'.repeat(this.difficulty);
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) return false;
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 50;
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address) balance -= tx.totalCost();
        if (tx.toAddress === address) balance += tx.amount;
      }
    }
    return Math.max(0, balance);
  }

  addTransaction(tx) {
    if (!tx.isValid()) throw new Error('Transacción no válida (firmas insuficientes o inválidas)');
    // Nota: en prototipo no verificamos saldo de la "multisig" de forma compleja
    this.pendingTransactions.push(tx);
    return true;
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    const block = new Block(
      Date.now(),
      [rewardTx, ...this.pendingTransactions],
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (!current.hasValidTransactions()) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }

  createTransaction(toAddress, amount, fee = 1) {
    const tx = new Transaction(this.address, toAddress, amount, fee);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 20: Multi-firma educativa básica ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();
const charlie = new Wallet();
const miner = new Wallet();
const recipient = new Wallet();

const jscoin = new Blockchain();

// Minamos recompensas normales para tener fondos
console.log('1. Minando bloques de recompensa...');
jscoin.minePendingTransactions(alice.address);
jscoin.minePendingTransactions(bob.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

// Creamos una transacción multisig 2-de-3 (Alice, Bob, Charlie)
console.log('2. Configurando transacción MULTISIG 2-de-3...');
const multiTx = new Transaction(null, recipient.address, 30, 1);
multiTx.setupMultisig([alice.address, bob.address, charlie.address], 2);

console.log(`Dirección multisig simulada: ${multiTx.fromAddress}`);
console.log(`Firmas requeridas: ${multiTx.requiredSignatures}`);

// Intentamos añadir con 0 firmas
try {
  jscoin.addTransaction(multiTx);
  console.log('ERROR: no debería aceptar sin firmas');
} catch (e) {
  console.log('✓ Correcto: rechazada sin firmas suficientes →', e.message);
}

// Añadimos 1 firma (Alice)
console.log('\n3. Añadiendo 1 firma (Alice)...');
multiTx.addSignature(alice.keyPair);
try {
  jscoin.addTransaction(multiTx);
  console.log('ERROR: no debería aceptar con 1 firma');
} catch (e) {
  console.log('✓ Correcto: rechazada con solo 1 firma →', e.message);
}

// Añadimos segunda firma (Bob)
console.log('\n4. Añadiendo segunda firma (Bob)...');
multiTx.addSignature(bob.keyPair);
console.log(`Firmas actuales: ${multiTx.signatures.length}`);

try {
  jscoin.addTransaction(multiTx);
  console.log('✓ Transacción multisig aceptada con 2 firmas');
  jscoin.minePendingTransactions(miner.address);
  console.log('Bloque minado con la transacción multisig');
} catch (e) {
  console.log('Error inesperado:', e.message);
}

console.log(`\nSaldo Recipient: ${jscoin.getBalanceOfAddress(recipient.address)}`);
console.log(`Cadena válida final: ${jscoin.isChainValid()}`);

console.log('\n--- Fin de la práctica 20 ---');
console.log('Recuerda: esto es solo un prototipo educativo. En Bitcoin real se usan scripts (P2SH/P2WSH) y OP_CHECKMULTISIG.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
