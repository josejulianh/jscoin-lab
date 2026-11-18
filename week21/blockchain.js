// JScoin - Semana/Día 21: HTLC educativos básicos
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Simula el concepto de Hash Time-Locked Contract a nivel de aplicación.
// No implementa scripts reales de Bitcoin (OP_HASH160, CLTV, etc.).

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
    this.id = crypto.randomBytes(8).toString('hex');
    // Campos HTLC
    this.htlcHash = null;
    this.htlcTimeout = null;
    this.preimage = null;
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.fee + this.timestamp + this.id + (this.htlcHash || ''))
      .digest('hex');
  }

  sign(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('No puedes firmar transacciones de otras wallets');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    if (this.fromAddress === null) return true;
    if (!this.signature) return false;
    try {
      const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
      return publicKey.verify(this.calculateHash(), this.signature) && this.amount > 0 && this.fee >= 0;
    } catch (e) {
      return false;
    }
  }

  totalCost() {
    return this.amount + this.fee;
  }

  // Configura como HTLC
  setupHTLC(preimage, timeoutMs = 30000) {
    this.htlcHash = crypto.createHash('sha256').update(preimage).digest('hex');
    this.htlcTimeout = Date.now() + timeoutMs;
  }

  // Reclama con preimagen
  claimWithPreimage(preimage) {
    const computed = crypto.createHash('sha256').update(preimage).digest('hex');
    if (computed !== this.htlcHash) throw new Error('Preimagen incorrecta');
    if (Date.now() > this.htlcTimeout) throw new Error('HTLC expirado');
    this.preimage = preimage;
    return true;
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
    if (!tx.isValid()) throw new Error('Transacción no válida');
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
console.log('=== JScoin Lab - Práctica 21: HTLC educativos básicos ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();
const miner = new Wallet();

const jscoin = new Blockchain();

console.log('1. Minando recompensas...');
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

const secretPreimage = 'mi-secreto-htlc-educativo';
console.log('2. Alice crea HTLC hacia Bob con preimagen secreta...');
const htlcTx = alice.createTransaction(bob.address, 20, 1);
htlcTx.setupHTLC(secretPreimage, 60000); // 60 segundos
jscoin.addTransaction(htlcTx);
jscoin.minePendingTransactions(miner.address);
console.log(`HTLC creado. Hash: ${htlcTx.htlcHash.substring(0, 16)}...`);
console.log(`Timeout: ${new Date(htlcTx.htlcTimeout).toISOString()}\n`);

console.log('3. Bob intenta reclamar con preimagen correcta...');
try {
  htlcTx.claimWithPreimage(secretPreimage);
  console.log('✓ Preimagen correcta → reclamación exitosa (simulada)');
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n4. Intento con preimagen incorrecta...');
try {
  htlcTx.claimWithPreimage('preimagen-mala');
  console.log('ERROR: no debería aceptar');
} catch (e) {
  console.log('✓ Correcto: rechazada →', e.message);
}

console.log(`\nSaldo Bob (antes de minar reclamación real): ${jscoin.getBalanceOfAddress(bob.address)}`);
console.log(`Cadena válida final: ${jscoin.isChainValid()}`);

console.log('\n--- Fin de la práctica 21 ---');
console.log('Recuerda: esto es solo un prototipo educativo. En Bitcoin real se usan scripts HTLC con OP_HASH160 y CLTV.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
