// JScoin - Semana/Día 9: Persistencia de la cadena y wallets simples
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: base de datos real, wallets seguros, red P2P, consenso de producción, etc.
// Simula persistencia en JSON y wallets básicos con elliptic.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const CHAIN_FILE = path.join(__dirname, 'chain.json');

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
    this.id = crypto.randomBytes(8).toString('hex');
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + this.id)
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
    if (this.amount <= 0) return false;
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
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
      .update(
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce +
        this.difficulty
      )
      .digest('hex');
  }

  mineBlock() {
    const target = '0'.repeat(this.difficulty);
    const start = Date.now();
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Bloque minado: ${this.hash.substring(0, 16)}... (diff: ${this.difficulty}, nonce: ${this.nonce}, ${Date.now() - start}ms)`);
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
    this.adjustmentInterval = 4;
    this.targetBlockTime = 8000;
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  adjustDifficulty() {
    if (this.chain.length % this.adjustmentInterval !== 0) return;

    const last = this.getLatestBlock();
    const previous = this.chain[this.chain.length - this.adjustmentInterval];
    const timeExpected = this.targetBlockTime * this.adjustmentInterval;
    const timeActual = last.timestamp - previous.timestamp;

    const oldDiff = this.difficulty;
    if (timeActual < timeExpected * 0.7) {
      this.difficulty = Math.min(this.difficulty + 1, 5);
      console.log(`↑ Dificultad aumentada: ${oldDiff} → ${this.difficulty}`);
    } else if (timeActual > timeExpected * 1.5) {
      this.difficulty = Math.max(this.difficulty - 1, 1);
      console.log(`↓ Dificultad disminuida: ${oldDiff} → ${this.difficulty}`);
    }
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();

    this.chain.push(block);
    this.pendingTransactions = [];
    this.adjustDifficulty();
    this.saveChain();
    return block;
  }

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

    if (this.pendingTransactions.some(tx => tx.id === transaction.id)) {
      return false;
    }

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
    return true;
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
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }

  saveChain() {
    try {
      const data = JSON.stringify({
        chain: this.chain,
        difficulty: this.difficulty
      }, null, 2);
      fs.writeFileSync(CHAIN_FILE, data);
      console.log(`Cadena guardada en ${CHAIN_FILE} (${this.chain.length} bloques)`);
    } catch (e) {
      console.error('Error guardando cadena:', e.message);
    }
  }

  loadChain() {
    if (!fs.existsSync(CHAIN_FILE)) {
      console.log('No existe cadena previa. Iniciando desde génesis.');
      return false;
    }
    try {
      const raw = fs.readFileSync(CHAIN_FILE, 'utf8');
      const data = JSON.parse(raw);
      // Reconstruir objetos (simplificado: solo asignamos propiedades)
      this.chain = data.chain.map(b => {
        const block = Object.assign(new Block(0, [], ''), b);
        // Rehidratar transacciones
        block.transactions = b.transactions.map(t => Object.assign(new Transaction(null, null, 1), t));
        return block;
      });
      this.difficulty = data.difficulty || 2;
      if (!this.isChainValid()) {
        console.error('Cadena cargada no válida. Reiniciando.');
        this.chain = [this.createGenesisBlock()];
        return false;
      }
      console.log(`Cadena cargada correctamente (${this.chain.length} bloques, diff: ${this.difficulty})`);
      return true;
    } catch (e) {
      console.error('Error cargando cadena:', e.message);
      return false;
    }
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }

  getPrivateKey() {
    return this.keyPair.getPrivate('hex');
  }

  createTransaction(toAddress, amount) {
    const tx = new Transaction(this.address, toAddress, amount);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== DEMO ==========
function runDemo() {
  console.log('=== JScoin Lab - Práctica 9: Persistencia y Wallets ===');
  console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

  const blockchain = new Blockchain();
  blockchain.loadChain();

  const alice = new Wallet();
  const bob = new Wallet();

  console.log('Alice address:', alice.address.substring(0, 24) + '...');
  console.log('Bob address:  ', bob.address.substring(0, 24) + '...\n');

  console.log('Saldo inicial Alice:', blockchain.getBalanceOfAddress(alice.address));
  console.log('Saldo inicial Bob:  ', blockchain.getBalanceOfAddress(bob.address));

  console.log('\n--- Minando un par de bloques de recompensa para Alice ---');
  blockchain.minePendingTransactions(alice.address);
  blockchain.minePendingTransactions(alice.address);

  console.log('\nSaldo Alice después de minar:', blockchain.getBalanceOfAddress(alice.address));

  if (blockchain.getBalanceOfAddress(alice.address) >= 50) {
    console.log('\n--- Enviando 50 de Alice a Bob ---');
    const tx = alice.createTransaction(bob.address, 50);
    try {
      blockchain.addTransaction(tx);
      console.log('Transacción añadida al mempool.');
      blockchain.minePendingTransactions(alice.address);
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  console.log('\n--- Estado final ---');
  console.log('Longitud de cadena:', blockchain.chain.length);
  console.log('¿Válida?', blockchain.isChainValid());
  console.log('Saldo Alice:', blockchain.getBalanceOfAddress(alice.address));
  console.log('Saldo Bob:  ', blockchain.getBalanceOfAddress(bob.address));
  console.log('Dificultad actual:', blockchain.difficulty);

  blockchain.saveChain();

  console.log('\nFin de la práctica 9. Ejecuta de nuevo para ver la persistencia.');
  console.log('Archivo generado:', CHAIN_FILE);
}

runDemo();
