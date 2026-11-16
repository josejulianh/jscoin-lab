// JScoin - Semana/Día 19: Explorador simple de la cadena y cierre del laboratorio
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Basado en las prácticas anteriores. Añade visualización clara de la cadena.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount, fee = 0, size = 200) {
    if (amount <= 0 && fromAddress !== null) throw new Error('El importe debe ser positivo');
    if (fee < 0) throw new Error('La fee no puede ser negativa');
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.fee = fee;
    this.size = size;
    this.timestamp = Date.now();
    this.signature = null;
    this.id = crypto.randomBytes(8).toString('hex');
  }

  getFeeRate() {
    return this.fee / Math.max(1, this.size);
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.fee + this.size + this.timestamp + this.id)
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
    if (!this.signature || this.signature.length === 0) return false;
    if (this.amount <= 0 || this.fee < 0) return false;
    try {
      const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
      return publicKey.verify(this.calculateHash(), this.signature);
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
    if (!tx.isValid()) throw new Error('Transacción no válida');
    const available = this.getBalanceOfAddress(tx.fromAddress);
    if (available < tx.totalCost()) {
      throw new Error(`Saldo insuficiente. Disponible: ${available}, necesario: ${tx.totalCost()}`);
    }
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

  // ========== EXPLORADOR EDUCATIVO ==========
  explore() {
    console.log('\n========== EXPLORADOR JSCOIN (prototipo educativo) ==========');
    console.log(`Altura de la cadena: ${this.chain.length - 1} bloques`);
    console.log(`Último hash: ${this.getLatestBlock().hash.substring(0, 16)}...`);
    console.log(`Cadena válida: ${this.isChainValid()}`);
    console.log('-------------------------------------------------------------');

    this.chain.forEach((block, index) => {
      const date = new Date(block.timestamp).toLocaleString();
      console.log(`\nBloque #${index}`);
      console.log(`  Timestamp : ${date}`);
      console.log(`  Hash      : ${block.hash.substring(0, 20)}...`);
      console.log(`  Prev Hash : ${block.previousHash.substring(0, 20)}...`);
      console.log(`  Nonce     : ${block.nonce}`);
      console.log(`  Dificultad: ${block.difficulty}`);
      console.log(`  Transacciones (${block.transactions.length}):`);
      block.transactions.forEach((tx, i) => {
        const from = tx.fromAddress === null ? 'COINBASE' : tx.fromAddress.substring(0, 12) + '...';
        const to = tx.toAddress.substring(0, 12) + '...';
        console.log(`    ${i + 1}. ${from} → ${to} | ${tx.amount} JSC | fee=${tx.fee} | id=${tx.id.substring(0, 8)}...`);
      });
    });

    console.log('\n========== FIN DEL EXPLORADOR ==========\n');
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
console.log('=== JScoin Lab - Práctica 19: Explorador simple y cierre del laboratorio ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();
const miner = new Wallet();

const jscoin = new Blockchain();

console.log('1. Minando bloques de recompensa...');
jscoin.minePendingTransactions(alice.address);
jscoin.minePendingTransactions(miner.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

console.log('2. Creando y minando transacciones...');
try {
  jscoin.addTransaction(alice.createTransaction(bob.address, 20, 2));
  jscoin.addTransaction(alice.createTransaction(miner.address, 10, 1));
  jscoin.minePendingTransactions(miner.address);
} catch (e) {
  console.log('Aviso:', e.message);
}

console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo Bob: ${jscoin.getBalanceOfAddress(bob.address)}`);
console.log(`Saldo Miner: ${jscoin.getBalanceOfAddress(miner.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}`);

// Explorador
jscoin.explore();

console.log('\n🎉 ¡Laboratorio JScoin completado!');
console.log('Has avanzado desde fundamentos hasta exploración de la cadena.');
console.log('Recuerda: todo es un prototipo educativo. No uses este código con valor real.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
console.log('Laboratorio online: https://josejulianh.github.io/jscoin-lab/');
console.log('\n--- Fin de la práctica 19 y del laboratorio progresivo ---');
