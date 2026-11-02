// JScoin - Semana/Día 7: Mejoras de red y sincronización de mempool
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: red P2P real, sockets, descubrimiento de peers, fees avanzados, etc.
// Simula propagación de transacciones y sincronización de mempool entre nodos.

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
    this.id = crypto.randomBytes(8).toString('hex'); // ID simple para evitar duplicados
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

    // Evitar duplicados por ID
    if (this.pendingTransactions.some(tx => tx.id === transaction.id)) {
      return false; // ya existe
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
    }
    return true;
  }

  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) return false;
    const temp = new Blockchain();
    temp.chain = newChain;
    if (!temp.isChainValid()) return false;
    this.chain = newChain;
    // Limpiar del mempool las transacciones que ya están en la nueva cadena
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

// ========== SIMULACIÓN DE RED CON MEMPOOL ==========
class Node {
  constructor(name) {
    this.name = name;
    this.blockchain = new Blockchain();
    this.peers = [];
  }

  connect(peer) {
    if (!this.peers.includes(peer)) {
      this.peers.push(peer);
      peer.peers.push(this);
    }
  }

  mine(rewardAddress) {
    console.log(`\n[${this.name}] Minando...`);
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
      console.log(`[${this.name}] Cadena adoptada. Nueva longitud: ${this.blockchain.chain.length}. Mempool limpio: ${this.blockchain.pendingTransactions.length} tx`);
    }
  }

  // Nueva funcionalidad: propagar transacción
  broadcastTransaction(transaction) {
    console.log(`[${this.name}] Intentando añadir y propagar transacción de ${transaction.amount}...`);
    try {
      const added = this.blockchain.addTransaction(transaction);
      if (added) {
        console.log(`[${this.name}] Transacción añadida al mempool.`);
        for (const peer of this.peers) {
          peer.receiveTransaction(transaction);
        }
      } else {
        console.log(`[${this.name}] Transacción ya existía en mempool.`);
      }
    } catch (e) {
      console.log(`[${this.name}] Transacción rechazada: ${e.message}`);
    }
  }

  receiveTransaction(transaction) {
    console.log(`[${this.name}] Recibida transacción (id: ${transaction.id.substring(0, 8)}...)`);
    try {
      const added = this.blockchain.addTransaction(transaction);
      if (added) {
        console.log(`[${this.name}] Transacción aceptada en mempool.`);
        // Re-propagar (simple, sin control de bucles avanzado)
        for (const peer of this.peers) {
          if (peer !== this) peer.receiveTransaction(transaction);
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
      mempool: this.blockchain.pendingTransactions.length
    };
  }
}

// ========== DEMO / PRUEBAS ==========
console.log('=== JScoin Lab - Práctica 7: Sincronización de mempool y propagación de transacciones ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

// Wallets
const aliceKey = ec.genKeyPair();
const aliceAddress = aliceKey.getPublic('hex');
const bobKey = ec.genKeyPair();
const bobAddress = bobKey.getPublic('hex');

console.log('Alice:', aliceAddress.substring(0, 20) + '...');
console.log('Bob:  ', bobAddress.substring(0, 20) + '...\n');

// Crear nodos
const nodeA = new Node('Nodo-A');
const nodeB = new Node('Nodo-B');
const nodeC = new Node('Nodo-C');

nodeA.connect(nodeB);
nodeB.connect(nodeC);

console.log('Red creada: A ↔ B ↔ C\n');

// Minar recompensa inicial para Alice en Nodo A
console.log('--- Minando recompensa inicial para Alice (Nodo A) ---');
nodeA.mine(aliceAddress);

console.log('\n--- Estado después de minado inicial ---');
[nodeA, nodeB, nodeC].forEach(n => {
  const s = n.status();
  console.log(`${s.name}: longitud=${s.length}, mempool=${s.mempool}, saldo Alice=${n.blockchain.getBalanceOfAddress(aliceAddress)}`);
});

// Crear y propagar transacción válida desde Nodo A
console.log('\n--- Propagando transacción válida: Alice → Bob 40 (desde Nodo A) ---');
const txValid = new Transaction(aliceAddress, bobAddress, 40);
txValid.sign(aliceKey);
nodeA.broadcastTransaction(txValid);

console.log('\n--- Mempools después de propagación ---');
[nodeA, nodeB, nodeC].forEach(n => console.log(`${n.name}: ${n.blockchain.pendingTransactions.length} tx en mempool`));

// Minar el bloque que incluye la transacción (desde Nodo B)
console.log('\n--- Nodo B mina el bloque con la transacción ---');
nodeB.mine(aliceAddress);

console.log('\n--- Estado final ---');
[nodeA, nodeB, nodeC].forEach(n => {
  const s = n.status();
  console.log(`${s.name}: longitud=${s.length}, válida=${s.valid}, mempool=${s.mempool}`);
  console.log(`  Saldo Alice: ${n.blockchain.getBalanceOfAddress(aliceAddress)}`);
  console.log(`  Saldo Bob:   ${n.blockchain.getBalanceOfAddress(bobAddress)}`);
});

// Intento de double-spend
console.log('\n--- Intento de propagar transacción con saldo insuficiente ---');
const txOver = new Transaction(aliceAddress, bobAddress, 500);
txOver.sign(aliceKey);
nodeA.broadcastTransaction(txOver);

console.log('\n¿Todas las cadenas son válidas?', 
  nodeA.blockchain.isChainValid() && 
  nodeB.blockchain.isChainValid() && 
  nodeC.blockchain.isChainValid());

console.log('\nFin de la práctica 7. Prototipo educativo completado.');
