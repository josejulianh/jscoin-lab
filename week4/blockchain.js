// JScoin - Semana/Día 4: Consenso básico (regla de la cadena más larga)
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: red P2P real, propagación de bloques, reorganizaciones complejas, seguridad avanzada, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
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
    if (this.fromAddress === null) return true;
    if (!this.signature || this.signature.length === 0) {
      throw new Error('No hay firma en esta transacción');
    }
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
    while (this.hash.substring(0, difficulty) !== target) {
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
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('La transacción debe incluir from y to');
    }
    if (!transaction.isValid()) {
      throw new Error('No se puede añadir una transacción no válida');
    }
    this.pendingTransactions.push(transaction);
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
    }
    return true;
  }

  // Consenso: adopta la cadena si es más larga y válida
  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log('Cadena recibida no es más larga. Se ignora.');
      return false;
    }
    if (!this.isChainValid.call({ chain: newChain })) {
      console.log('Cadena recibida no es válida. Se ignora.');
      return false;
    }
    console.log('Cadena reemplazada por una más larga y válida.');
    this.chain = newChain;
    return true;
  }
}

// ========== DEMO / PRUEBAS ==========
console.log('=== JScoin Lab - Práctica 4: Consenso básico ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

// Wallets
const aliceKey = ec.genKeyPair();
const aliceAddress = aliceKey.getPublic('hex');
const bobKey = ec.genKeyPair();
const bobAddress = bobKey.getPublic('hex');

// Cadena principal (nodo A)
const chainA = new Blockchain();
chainA.minePendingTransactions(aliceAddress); // Bloque 1
chainA.minePendingTransactions(aliceAddress); // Bloque 2

console.log('Cadena A longitud:', chainA.chain.length);
console.log('Saldo Alice en A:', chainA.getBalanceOfAddress(aliceAddress));

// Cadena alternativa (nodo B) más larga
const chainB = new Blockchain();
chainB.minePendingTransactions(bobAddress);
chainB.minePendingTransactions(bobAddress);
chainB.minePendingTransactions(bobAddress); // 3 bloques → más larga

console.log('\nCadena B longitud:', chainB.chain.length);
console.log('Saldo Bob en B:', chainB.getBalanceOfAddress(bobAddress));

// Nodo A adopta la cadena B (más larga y válida)
console.log('\n--- Aplicando consenso ---');
const replaced = chainA.replaceChain(chainB.chain);
console.log('Cadena reemplazada?', replaced);
console.log('Nueva longitud en A:', chainA.chain.length);
console.log('Saldo Alice después:', chainA.getBalanceOfAddress(aliceAddress));
console.log('Saldo Bob después:', chainA.getBalanceOfAddress(bobAddress));

console.log('\n¿Cadena válida?', chainA.isChainValid());

// Prueba: intentar reemplazar por una cadena más corta (debe fallar)
console.log('\n--- Prueba cadena más corta ---');
const shortChain = [chainA.chain[0]];
console.log('Reemplazo por cadena corta?', chainA.replaceChain(shortChain));
