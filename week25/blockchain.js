// JScoin - Semana/Día 25: Simulación educativa de ataque del 51%
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Simula de forma simplificada el efecto de una mayoría de poder de hash.
// No implementa hashrate real, red P2P, dificultad adaptativa ni protecciones de producción.

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
    this.work = 1;
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
    this.orphanBlocks = [];
    this.securityEvents = [];
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2, 'genesis');
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
      this.difficulty,
      miningRewardAddress
    );
    block.mineBlock();
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  getChainWork(chain) {
    return chain.reduce((sum, block) => sum + (block.work || 1), 0);
  }

  calculateHashrateShare(address, lastN = 10) {
    const recent = this.chain.slice(-lastN);
    if (recent.length === 0) return 0;
    const minedBy = recent.filter(b => b.miner === address).length;
    return minedBy / recent.length;
  }

  detect51Attack(threshold = 0.51, lastN = 8) {
    const shares = {};
    const recent = this.chain.slice(-lastN);
    for (const block of recent) {
      if (!shares[block.miner]) shares[block.miner] = 0;
      shares[block.miner]++;
    }
    for (const [miner, count] of Object.entries(shares)) {
      const share = count / recent.length;
      if (share >= threshold) {
        const event = {
          type: 'possible_51_attack',
          miner: miner.substring(0, 16) + '...',
          share: (share * 100).toFixed(1) + '%',
          blocksAnalyzed: recent.length,
          timestamp: Date.now()
        };
        this.securityEvents.push(event);
        console.log(`\n⚠️  ALERTA EDUCATIVA: Posible ataque del 51%`);
        console.log(`   Minero ${event.miner} controla ${event.share} de los últimos ${event.blocksAnalyzed} bloques.`);
        return event;
      }
    }
    return null;
  }

  performReorg(alternativeChain) {
    const currentWork = this.getChainWork(this.chain);
    const altWork = this.getChainWork(alternativeChain);

    if (altWork > currentWork) {
      console.log('¡Reorg detectado! Adoptando cadena con más trabajo...');
      const commonLength = Math.min(this.chain.length, alternativeChain.length);
      for (let i = commonLength; i < this.chain.length; i++) {
        this.orphanBlocks.push(this.chain[i]);
        for (const tx of this.chain[i].transactions) {
          if (tx.fromAddress !== null) this.pendingTransactions.push(tx);
        }
      }
      this.chain = alternativeChain;
      return true;
    }
    return false;
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

  getSecurityEvents() {
    return this.securityEvents;
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
console.log('=== JScoin Lab - Práctica 25: Simulación educativa de ataque del 51% ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const majorityMiner = new Wallet();
const minorityMiner = new Wallet();
const user = new Wallet();

const jscoin = new Blockchain();

console.log('1. Fase inicial: minado equilibrado...');
for (let i = 0; i < 4; i++) {
  jscoin.minePendingTransactions(i % 2 === 0 ? majorityMiner.address : minorityMiner.address);
}
console.log(`Longitud: ${jscoin.chain.length}, Válida: ${jscoin.isChainValid()}`);
console.log(`Share mayoría (últimos 6): ${(jscoin.calculateHashrateShare(majorityMiner.address, 6) * 100).toFixed(1)}%\n`);

console.log('2. La mayoría empieza a minar más rápido (simulación de 51%+ )...');
for (let i = 0; i < 6; i++) {
  jscoin.minePendingTransactions(majorityMiner.address);
}

console.log('3. Detección de posible ataque...');
const alert = jscoin.detect51Attack(0.51, 8);
if (alert) {
  console.log('Evento registrado:', alert.type);
}

console.log('\n4. Simulación de reorg forzado por la mayoría...');
const altChain = jscoin.chain.slice(0, 5);
for (let i = 0; i < 8; i++) {
  const block = new Block(
    Date.now(),
    [new Transaction(null, majorityMiner.address, 50)],
    altChain[altChain.length - 1].hash,
    2,
    majorityMiner.address
  );
  block.mineBlock();
  altChain.push(block);
}

const reorged = jscoin.performReorg(altChain);
console.log(`¿Reorg realizado? ${reorged}`);
console.log(`Nueva longitud: ${jscoin.chain.length}`);
console.log(`Bloques huérfanos: ${jscoin.orphanBlocks.length}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}`);
console.log(`Eventos de seguridad registrados: ${jscoin.getSecurityEvents().length}`);

console.log('\n--- Fin de la práctica 25 ---');
console.log('Recuerda: en Bitcoin real un ataque del 51% requiere un poder de hash enorme');
console.log('y es vigilado constantemente. Este código solo ilustra el concepto.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
