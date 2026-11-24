// JScoin - Semana/Día 27: Ataques Eclipse y Sybil educativos básicos
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Simula de forma simplificada conceptos de eclipse y Sybil.
// No implementa red P2P real, discovery, ban lists ni protecciones de producción.

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

class Peer {
  constructor(id, isSybil = false, origin = 'honest') {
    this.id = id;
    this.isSybil = isSybil;
    this.origin = origin; // 'honest' o 'attacker'
    this.chain = null;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 50;
    this.peers = [];
    this.securityEvents = [];
    this.eclipsed = false;
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

  addPeer(peer) {
    this.peers.push(peer);
  }

  // Simula eclipse: solo peers del atacante
  eclipse(attackerOrigin = 'attacker') {
    const attackerPeers = this.peers.filter(p => p.origin === attackerOrigin);
    if (attackerPeers.length === 0) return false;
    this.eclipsed = true;
    this.activePeers = attackerPeers;
    const event = {
      type: 'eclipse_started',
      attackerPeers: attackerPeers.length,
      timestamp: Date.now()
    };
    this.securityEvents.push(event);
    console.log(`\n⚠️  NODO ECLIPSADO: solo conectado a ${attackerPeers.length} peers del atacante`);
    return true;
  }

  // El atacante alimenta una cadena alternativa
  receiveAttackerChain(altChain) {
    if (!this.eclipsed) return false;
    // Acepta la cadena del atacante (simplificado: más larga)
    if (altChain.length > this.chain.length) {
      console.log('   Nodo eclipsado acepta cadena alternativa del atacante');
      this.chain = altChain;
      return true;
    }
    return false;
  }

  detectLowDiversity(threshold = 0.7) {
    if (!this.peers.length) return null;
    const origins = {};
    for (const p of this.peers) {
      origins[p.origin] = (origins[p.origin] || 0) + 1;
    }
    const attackerShare = (origins['attacker'] || 0) / this.peers.length;
    if (attackerShare >= threshold || this.eclipsed) {
      const event = {
        type: 'possible_eclipse_or_sybil',
        attackerShare: (attackerShare * 100).toFixed(1) + '%',
        totalPeers: this.peers.length,
        eclipsed: this.eclipsed,
        timestamp: Date.now()
      };
      this.securityEvents.push(event);
      return event;
    }
    return null;
  }

  reconnectToHonest() {
    this.eclipsed = false;
    this.activePeers = this.peers.filter(p => p.origin === 'honest');
    const event = {
      type: 'reconnected_to_honest',
      honestPeers: this.activePeers.length,
      timestamp: Date.now()
    };
    this.securityEvents.push(event);
    console.log('\n✅ Nodo reconectado a peers honestos');
    return true;
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
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 27: Ataques Eclipse y Sybil educativos básicos ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const honestMiner = new Wallet();
const attacker = new Wallet();

const node = new Blockchain();

// Peers honestos
for (let i = 0; i < 5; i++) {
  node.addPeer(new Peer(`honest-${i}`, false, 'honest'));
}

// Peers Sybil del atacante
for (let i = 0; i < 12; i++) {
  node.addPeer(new Peer(`sybil-${i}`, true, 'attacker'));
}

console.log(`Total peers: ${node.peers.length} (honestos: 5, Sybil: 12)\n`);

console.log('1. Minado inicial en la red honesta...');
for (let i = 0; i < 4; i++) {
  node.minePendingTransactions(honestMiner.address);
}
console.log(`Longitud cadena honesta: ${node.chain.length}, Válida: ${node.isChainValid()}\n`);

// Cadena alternativa del atacante (más larga artificialmente)
const attackerChain = [...node.chain];
for (let i = 0; i < 3; i++) {
  const rewardTx = new Transaction(null, attacker.address, 50);
  const block = new Block(Date.now(), [rewardTx], attackerChain[attackerChain.length - 1].hash, 2, attacker.address);
  block.mineBlock();
  attackerChain.push(block);
}
console.log(`Cadena del atacante (alternativa): ${attackerChain.length} bloques\n`);

console.log('2. El atacante realiza eclipse...');
node.eclipse('attacker');

console.log('3. El nodo eclipsado recibe la cadena del atacante...');
node.receiveAttackerChain(attackerChain);
console.log(`Longitud ahora vista por el nodo: ${node.chain.length}`);
console.log(`Cadena válida: ${node.isChainValid()}`);

console.log('\n4. Detección de baja diversidad / posible Sybil...');
const alert = node.detectLowDiversity(0.5);
if (alert) {
  console.log('Evento registrado:', alert.type, '-', alert.attackerShare);
}

console.log('\n5. El nodo se reconecta a peers honestos...');
node.reconnectToHonest();

console.log(`\nEventos de seguridad registrados: ${node.getSecurityEvents().length}`);
console.log('\n--- Fin de la práctica 27 ---');
console.log('Recuerda: en Bitcoin real existen protecciones contra eclipse (diversidad de buckets,');
console.log('feelers, ban lists) y el coste de Sybil es alto. Este código solo ilustra el concepto.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
