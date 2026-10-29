// JScoin - Semana/Día 3: Transacciones y firmas digitales
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Requiere: npm install elliptic

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
    // Transacción de recompensa de minería (sin fromAddress)
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
    const start = Date.now();
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Bloque minado: ${this.hash} (nonce: ${this.nonce}, ${Date.now() - start}ms)`);
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

    console.log('Bloque minado correctamente');
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
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
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
}

// ========== DEMO / PRUEBAS ==========
console.log('=== JScoin Lab - Práctica 3: Transacciones y firmas ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

// Generar wallets
const myKey = ec.genKeyPair();
const myWalletAddress = myKey.getPublic('hex');

const otherKey = ec.genKeyPair();
const otherWalletAddress = otherKey.getPublic('hex');

console.log('Wallet Alice (myWallet):', myWalletAddress.substring(0, 20) + '...');
console.log('Wallet Bob:', otherWalletAddress.substring(0, 20) + '...\n');

const jscoin = new Blockchain();

// Minar el primer bloque (recompensa inicial para Alice)
console.log('Minando primer bloque...');
jscoin.minePendingTransactions(myWalletAddress);

// Crear y firmar una transacción
const tx1 = new Transaction(myWalletAddress, otherWalletAddress, 50);
tx1.sign(myKey);
jscoin.addTransaction(tx1);

console.log('\nMinando segundo bloque...');
jscoin.minePendingTransactions(myWalletAddress);

console.log('\nSaldos:');
console.log('Alice:', jscoin.getBalanceOfAddress(myWalletAddress));
console.log('Bob:', jscoin.getBalanceOfAddress(otherWalletAddress));

console.log('\n¿Cadena válida?', jscoin.isChainValid());

// Prueba de alteración
console.log('\n--- Prueba de alteración ---');
try {
  jscoin.chain[1].transactions[0].amount = 999;
  console.log('¿Cadena válida después de alterar amount?', jscoin.isChainValid());
} catch (e) {
  console.log('Error al validar (esperado):', e.message);
}
