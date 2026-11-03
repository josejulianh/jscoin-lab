// JScoin - Semana/Día 8: Dificultad adaptativa y consideraciones adicionales
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: red P2P real, ajuste de dificultad de producción, most-work consensus, etc.
// Simula dificultad adaptativa simple y mejoras menores de propagación.

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
    this.targetBlockTime = 8000; // 8 segundos (educativo)
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
      this.difficulty = Math.min(this.difficulty + 1, 5); // límite educativo
      console.log(`↑ Dificultad aumentada: ${oldDiff} → ${this.difficulty} (bloques muy rápidos)`);
    } else if (timeActual > timeExpected * 1.5) {
      this.difficulty = Math.max(this.difficulty - 1, 1);
      console.log(`↓ Dificultad disminuida: ${oldDiff} → ${this.difficulty} (bloques muy lentos)`);
    } else {
      console.log(`Dificultad mantenida en ${this.difficulty} (tiempo ok)`);
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
      // Comprobación simple de dificultad declarada
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }

  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) return false;
    const temp = new Blockchain();
    temp.chain = newChain;
    if (!temp.isChainValid()) return false;
    this.chain = newChain;
    this.cleanMempool();
    return true;
  }

  cleanMempool() {
    const includedIds = new Set();
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.id) includedIds.add(tx.id);
      }
    }
    this.pendingTransactions = this.pendingTransactions.filter(tx => !includedIds.has(tx.id));
  }
}

// ========== SIMULACIÓN DE RED CON MEJORAS ==========
class Node {
  constructor(name) {
    this.name = name;
    this.blockchain = new Blockchain();
    this.peers = [];
    this.seenTx = new Set(); // para evitar bucles
  }

  connect(peer) {
    if (!this.peers.includes(peer)) {
      this.peers.push(peer);
      peer.peers.push(this);
    }
  }

  mine(rewardAddress) {
    console.log(`\n[${this.name}] Minando... (diff actual: ${this.blockchain.difficulty})`);
    const block = this.blockchain.minePendingTransactions(rewardAddress);
    console.log(`[${this.name}] Bloque minado. Longitud: ${this.blockchain.chain.length}`);
    this.propagateChain();
    return block;
  }

  propagateChain() {
    console.log(`[${this.name}] Propagando cadena a ${this.peers.length} peer(s)...`);
    for (const peer of this.peers) {
      peer.receiveChain(this.blockchain.chain);
    }
  }

  receiveChain(newChain) {
    console.log(`[${this.name}] Recibida cadena de longitud ${newChain.length}`);
    const adopted = this.blockchain.replaceChain(newChain);
    if (adopted) {
      console.log(`[${this.name}] Cadena adoptada. Nueva longitud: ${this.blockchain.chain.length}`);
    }
  }

  broadcastTransaction(transaction, ttl = 3) {
    console.log(`[${this.name}] Intentando añadir y propagar transacción de ${transaction.amount}...`);
    try {
      const added = this.blockchain.addTransaction(transaction);
      if (added) {
        console.log(`[${this.name}] Transacción añadida al mempool.`);
        this.seenTx.add(transaction.id);
        for (const peer of this.peers) {
          peer.receiveTransaction(transaction, ttl - 1);
        }
      }
    } catch (e) {
      console.log(`[${this.name}] Transacción rechazada: ${e.message}`);
    }
  }

  receiveTransaction(transaction, ttl = 2) {
    if (ttl <= 0 || this.seenTx.has(transaction.id)) return;
    this.seenTx.add(transaction.id);

    console.log(`[${this.name}] Recibida transacción (id: ${transaction.id.substring(0, 8)}..., ttl: ${ttl})`);
    try {
      const added = this.blockchain.addTransaction(transaction);
      if (added) {
        console.log(`[${this.name}] Transacción aceptada en mempool.`);
        for (const peer of this.peers) {
          peer.receiveTransaction(transaction, ttl - 1);
        }
      }
    } catch (e) {
      console.log(`[${this.name}] Transacción rechazada: ${e.message}`);
    }
  }

  status() {
    return {
      name: this.name,
      length: this.blockchain.chain.length,
      valid: this.blockchain.isChainValid(),
      mempool: this.blockchain.pendingTransactions.length,
      difficulty: this.blockchain.difficulty
    };
  }
}

// ========== DEMO / PRUEBAS ==========
console.log('=== JScoin Lab - Práctica 8: Dificultad adaptativa ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

const aliceKey = ec.genKeyPair();
const aliceAddress = aliceKey.getPublic('hex');
const bobKey = ec.genKeyPair();
const bobAddress = bobKey.getPublic('hex');

console.log('Alice:', aliceAddress.substring(0, 20) + '...');
console.log('Bob:  ', bobAddress.substring(0, 20) + '...\n');

const nodeA = new Node('Nodo-A');
const nodeB = new Node('Nodo-B');

nodeA.connect(nodeB);

console.log('Red creada: A ↔ B\n');

console.log('--- Minando varios bloques para observar ajuste de dificultad ---');
for (let i = 0; i < 6; i++) {
  nodeA.mine(aliceAddress);
  // Pequeña pausa para que el tiempo sea medible
  await new Promise(r => setTimeout(r, 100));
}

console.log('\n--- Estado después de minería inicial ---');
[nodeA, nodeB].forEach(n => {
  const s = n.status();
  console.log(`${s.name}: longitud=${s.length}, diff=${s.difficulty}, mempool=${s.mempool}, saldo Alice=${n.blockchain.getBalanceOfAddress(aliceAddress)}`);
});

console.log('\n--- Propagando transacción válida: Alice → Bob 30 ---');
const tx = new Transaction(aliceAddress, bobAddress, 30);
tx.sign(aliceKey);
nodeA.broadcastTransaction(tx);

console.log('\n--- Minando bloque con la transacción ---');
nodeB.mine(aliceAddress);

console.log('\n--- Estado final ---');
[nodeA, nodeB].forEach(n => {
  const s = n.status();
  console.log(`${s.name}: longitud=${s.length}, válida=${s.valid}, diff=${s.difficulty}, mempool=${s.mempool}`);
  console.log(`  Saldo Alice: ${n.blockchain.getBalanceOfAddress(aliceAddress)}`);
  console.log(`  Saldo Bob:   ${n.blockchain.getBalanceOfAddress(bobAddress)}`);
});

console.log('\n¿Todas las cadenas son válidas?', 
  nodeA.blockchain.isChainValid() && nodeB.blockchain.isChainValid());

console.log('\nFin de la práctica 8. Prototipo educativo completado.');
// Nota: el código usa await top-level, requiere Node.js moderno (v14.8+ con --experimental-top-level-await o v16+). 
// Si falla, envuelve el demo en una función async.
