// JScoin - Semana/Día 6: Seguridad básica (double-spending y validaciones)
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: UTXO real, nonces, fees avanzados, red P2P segura, consenso formal, etc.
// Simula comprobación de saldo y rechazo de double-spend.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    if (amount <= 0) {
      throw new Error('El importe debe ser positivo');
    }
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = null;
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
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
    if (this.fromAddress === null) return true; // recompensa de minería
    if (!this.signature || this.signature.length === 0) {
      throw new Error('No hay firma en esta transacción');
    }
    if (this.amount <= 0) return false;
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    const start = Date.now();
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Bloque minado: ${this.hash.substring(0, 16)}... (nonce: ${this.nonce}, ${Date.now() - start}ms)`);
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
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(Date.now(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  // Seguridad: verifica saldo suficiente antes de aceptar
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('La transacción debe incluir from y to');
    }
    if (!transaction.isValid()) {
      throw new Error('No se puede añadir una transacción no válida');
    }
    if (transaction.fromAddress === transaction.toAddress) {
      throw new Error('No puedes enviar a ti mismo (en este prototipo)');
    }

    // Calcular saldo actual (incluyendo pending para evitar double-spend en mempool)
    const balance = this.getBalanceOfAddress(transaction.fromAddress);
    const pendingOut = this.pendingTransactions
      .filter(tx => tx.fromAddress === transaction.fromAddress)
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (balance - pendingOut < transaction.amount) {
      throw new Error(
        `Saldo insuficiente. Disponible: ${balance - pendingOut}, intentado: ${transaction.amount}`
      );
    }

    this.pendingTransactions.push(transaction);
    console.log(`Transacción añadida al mempool: ${transaction.amount} de ${transaction.fromAddress.substring(0, 10)}...`);
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) balance -= trans.amount;
        if (trans.toAddress === address) balance += trans.amount;
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (!current.hasValidTransactions()) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;

      // Validación extra educativa: comprobar que no hay overdraft en este bloque
      // (en un sistema real se haría de forma incremental con UTXO)
    }
    return true;
  }
}

// ========== DEMO / PRUEBAS =========
console.log('=== JScoin Lab - Práctica 6: Seguridad básica (double-spending) ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

// Wallets
const aliceKey = ec.genKeyPair();
const aliceAddress = aliceKey.getPublic('hex');
const bobKey = ec.genKeyPair();
const bobAddress = bobKey.getPublic('hex');

console.log('Alice:', aliceAddress.substring(0, 20) + '...');
console.log('Bob:  ', bobAddress.substring(0, 20) + '...\n');

const jscoin = new Blockchain();

// Minar recompensa inicial para Alice
console.log('--- Minando recompensa para Alice ---');
jscoin.minePendingTransactions(aliceAddress);
console.log('Saldo Alice:', jscoin.getBalanceOfAddress(aliceAddress));

// Transacción válida
console.log('\n--- Transacción válida: Alice → Bob 30 ---');
const txValid = new Transaction(aliceAddress, bobAddress, 30);
txValid.sign(aliceKey);
jscoin.addTransaction(txValid);

console.log('Minando bloque con la transacción...');
jscoin.minePendingTransactions(aliceAddress);

console.log('Saldo Alice:', jscoin.getBalanceOfAddress(aliceAddress));
console.log('Saldo Bob:  ', jscoin.getBalanceOfAddress(bobAddress));

// Intento de double-spend / saldo insuficiente
console.log('\n--- Intento de gastar más de lo disponible ---');
try {
  const txOver = new Transaction(aliceAddress, bobAddress, 200);
  txOver.sign(aliceKey);
  jscoin.addTransaction(txOver);
} catch (e) {
  console.log('Rechazada (esperado):', e.message);
}

// Importe negativo
console.log('\n--- Intento de importe negativo ---');
try {
  new Transaction(aliceAddress, bobAddress, -10);
} catch (e) {
  console.log('Rechazada (esperado):', e.message);
}

// Enviar a sí mismo
console.log('\n--- Intento de enviar a sí mismo ---');
try {
  const txSelf = new Transaction(aliceAddress, aliceAddress, 10);
  txSelf.sign(aliceKey);
  jscoin.addTransaction(txSelf);
} catch (e) {
  console.log('Rechazada (esperado):', e.message);
}

console.log('\n¿Cadena válida?', jscoin.isChainValid());
console.log('Longitud de cadena:', jscoin.chain.length);
console.log('\nFin de la práctica 6. Prototipo educativo completado.');
