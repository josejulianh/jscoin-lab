// JScoin - Semana/Día 28: Cierre avanzado del laboratorio
// Estadísticas completas, exportación JSON y lecciones de producción
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Consolida conceptos de todo el laboratorio. No implementa red P2P real,
// consensus de producción ni seguridad de nivel producción.

const crypto = require('crypto');
const fs = require('fs');
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
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.fee + this.timestamp + this.id)
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
}

class Block {
  constructor(timestamp, transactions, previousHash = '', difficulty = 2, miner = 'unknown') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.miner = miner;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce + this.difficulty + this.miner)
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
    const genesis = new Block(Date.now(), [], '0', 2, 'genesis');
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    const block = new Block(
      Date.now(),
      [rewardTx, ...this.pendingTransactions],
      this.getLatestBlock().hash,
      this.difficulty,
      miningRewardAddress
    );
    block.mineBlock();
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transacción debe incluir from y to');
    }
    if (!transaction.isValid()) {
      throw new Error('No se puede añadir transacción inválida');
    }
    this.pendingTransactions.push(transaction);
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

  getStats() {
    let totalTx = 0;
    let totalFees = 0;
    let totalRewards = 0;
    let totalDifficulty = 0;
    let blockTimes = [];
    const addresses = new Set();

    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      totalDifficulty += block.difficulty;
      if (i > 1) {
        blockTimes.push(block.timestamp - this.chain[i - 1].timestamp);
      }
      for (const tx of block.transactions) {
        totalTx++;
        totalFees += tx.fee || 0;
        if (tx.fromAddress === null) totalRewards += tx.amount;
        if (tx.fromAddress) addresses.add(tx.fromAddress);
        if (tx.toAddress) addresses.add(tx.toAddress);
      }
    }

    const avgBlockTime = blockTimes.length
      ? (blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length / 1000).toFixed(2)
      : 0;

    return {
      blocks: this.chain.length,
      transactions: totalTx,
      totalFees,
      totalRewardsIssued: totalRewards,
      uniqueAddresses: addresses.size,
      averageDifficulty: (totalDifficulty / (this.chain.length - 1 || 1)).toFixed(2),
      averageBlockTimeSeconds: avgBlockTime,
      chainValid: this.isChainValid()
    };
  }

  exportToJSON(filename = 'chain-export.json') {
    const data = {
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      chain: this.chain
    };
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return filename;
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 28: Cierre avanzado del laboratorio ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const miner = new Wallet();
const alice = new Wallet();
const bob = new Wallet();

const jscoin = new Blockchain();

console.log('1. Construyendo cadena de ejemplo...');
for (let i = 0; i < 5; i++) {
  jscoin.minePendingTransactions(miner.address);
}

const tx1 = new Transaction(alice.address, bob.address, 20, 1);
// En un prototipo real firmaríamos con la clave de Alice; aquí simplificamos la demo
jscoin.pendingTransactions.push(tx1);

jscoin.minePendingTransactions(miner.address);

console.log('\n2. Estadísticas de la cadena:');
const stats = jscoin.getStats();
console.log(JSON.stringify(stats, null, 2));

console.log('\n3. Exportando cadena a JSON...');
const file = jscoin.exportToJSON();
console.log(`Exportado correctamente a: ${file}`);

console.log('\n4. Validación final de la cadena:', jscoin.isChainValid());

console.log('\n=== Lecciones de producción (lo que este prototipo NO es) ===');
console.log('- No tiene red P2P real ni consensus de Nakamoto completo.');
console.log('- No tiene dificultad adaptativa de producción ni árboles de Merkle de Bitcoin.');
console.log('- No tiene UTXO set optimizado, script system ni fees de mercado.');
console.log('- No tiene protección real contra 51%, eclipse, Sybil, selfish mining, etc.');
console.log('- No gestiona claves de forma segura ni tiene HD wallets.');
console.log('- No es persistente de forma robusta ni tiene pruning/checkpoints.');
console.log('\nEste laboratorio es solo educativo. No uses este código con dinero real.');
console.log('\n--- Fin de la práctica 28 (cierre del laboratorio JScoin) ---');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
