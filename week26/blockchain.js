// JScoin - Semana/Día 26: Selfish Mining educativo y detección básica
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Simula de forma simplificada el concepto de selfish mining.
// No implementa hashrate real, red P2P, estrategias de publicación ni protecciones de producción.

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
    this.withheld = false; // marca educativa para bloques retenidos
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
    this.privateChains = {}; // mapa de direcciones a cadenas privadas (simulado)
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

  minePendingTransactions(miningRewardAddress, withhold = false) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    const previousHash = withhold && this.privateChains[miningRewardAddress]
      ? this.privateChains[miningRewardAddress][this.privateChains[miningRewardAddress].length - 1].hash
      : this.getLatestBlock().hash;

    const block = new Block(
      Date.now(),
      [rewardTx, ...this.pendingTransactions],
      previousHash,
      this.difficulty,
      miningRewardAddress
    );
    block.withheld = withhold;
    block.mineBlock();

    if (withhold) {
      if (!this.privateChains[miningRewardAddress]) {
        this.privateChains[miningRewardAddress] = [this.getLatestBlock()];
      }
      this.privateChains[miningRewardAddress].push(block);
      console.log(`   [Selfish] Bloque retenido en privado por ${miningRewardAddress.substring(0, 12)}... (cadena privada: ${this.privateChains[miningRewardAddress].length - 1} bloques)`);
    } else {
      this.chain.push(block);
      this.pendingTransactions = [];
    }
    return block;
  }

  publishPrivateChain(minerAddress) {
    const privateChain = this.privateChains[minerAddress];
    if (!privateChain || privateChain.length <= 1) return false;

    // La cadena privada incluye el último bloque público + bloques retenidos
    const altChain = privateChain;
    const reorged = this.performReorg(altChain);
    if (reorged) {
      delete this.privateChains[minerAddress];
      const event = {
        type: 'selfish_mining_publish',
        miner: minerAddress.substring(0, 16) + '...',
        blocksPublished: altChain.length - 1,
        timestamp: Date.now()
      };
      this.securityEvents.push(event);
      console.log(`\n⚠️  ALERTA EDUCATIVA: Posible Selfish Mining`);
      console.log(`   Minero ${event.miner} publicó ${event.blocksPublished} bloques retenidos y forzó un reorg.`);
      return true;
    }
    return false;
  }

  detectSelfishMining(threshold = 0.4, lastN = 10) {
    // Detección simplificada: concentración de bloques + reorgs recientes
    const recent = this.chain.slice(-lastN);
    if (recent.length < 3) return null;

    const shares = {};
    for (const block of recent) {
      if (!shares[block.miner]) shares[block.miner] = 0;
      shares[block.miner]++;
    }

    for (const [miner, count] of Object.entries(shares)) {
      const share = count / recent.length;
      if (share >= threshold && this.securityEvents.some(e => e.type === 'selfish_mining_publish')) {
        const event = {
          type: 'possible_selfish_mining',
          miner: miner.substring(0, 16) + '...',
          share: (share * 100).toFixed(1) + '%',
          blocksAnalyzed: recent.length,
          timestamp: Date.now()
        };
        this.securityEvents.push(event);
        return event;
      }
    }
    return null;
  }

  getChainWork(chain) {
    return chain.reduce((sum, block) => sum + (block.work || 1), 0);
  }

  performReorg(alternativeChain) {
    const currentWork = this.getChainWork(this.chain);
    const altWork = this.getChainWork(alternativeChain);

    if (altWork > currentWork) {
      console.log('   ¡Reorg detectado! Adoptando cadena con más trabajo...');
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
console.log('=== JScoin Lab - Práctica 26: Selfish Mining educativo y detección básica ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const honestMiner = new Wallet();
const selfishMiner = new Wallet();
const user = new Wallet();

const jscoin = new Blockchain();

console.log('1. Fase inicial: minado honesto...');
for (let i = 0; i < 5; i++) {
  jscoin.minePendingTransactions(i % 2 === 0 ? honestMiner.address : selfishMiner.address);
}
console.log(`Longitud pública: ${jscoin.chain.length}, Válida: ${jscoin.isChainValid()}\n`);

console.log('2. El minero selfish empieza a retener bloques (selfish mining)...');
for (let i = 0; i < 4; i++) {
  jscoin.minePendingTransactions(selfishMiner.address, true); // withhold = true
}
console.log(`Cadena privada del selfish: ${(jscoin.privateChains[selfishMiner.address] || []).length - 1} bloques retenidos\n`);

console.log('3. Mientras tanto, el minero honesto sigue minando en público...');
for (let i = 0; i < 2; i++) {
  jscoin.minePendingTransactions(honestMiner.address);
}
console.log(`Longitud pública ahora: ${jscoin.chain.length}\n`);

console.log('4. El minero selfish publica su cadena privada...');
const published = jscoin.publishPrivateChain(selfishMiner.address);
console.log(`¿Publicación exitosa (reorg)? ${published}`);
console.log(`Nueva longitud: ${jscoin.chain.length}`);
console.log(`Bloques huérfanos: ${jscoin.orphanBlocks.length}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}`);

console.log('\n5. Detección de patrón sospechoso...');
const alert = jscoin.detectSelfishMining(0.35, 10);
if (alert) {
  console.log('Evento registrado:', alert.type, '-', alert.share);
}

console.log(`\nEventos de seguridad registrados: ${jscoin.getSecurityEvents().length}`);
console.log('\n--- Fin de la práctica 26 ---');
console.log('Recuerda: en Bitcoin real el selfish mining es vigilado y las estrategias de los pools');
console.log('y la propagación rápida de bloques reducen su rentabilidad. Este código solo ilustra el concepto.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
