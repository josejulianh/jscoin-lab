// JScoin - Semana/Día 5: Redes y propagación básica de bloques
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: red P2P real, sockets, descubrimiento de peers, seguridad de red, etc.
// Simula varios nodos en memoria que intercambian cadenas.

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
    return block;
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

  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log('Cadena recibida no es más larga. Se ignora.');
      return false;
    }
    // Crear una instancia temporal para validar
    const temp = new Blockchain();
    temp.chain = newChain;
    if (!temp.isChainValid()) {
      console.log('Cadena recibida no es válida. Se ignora.');
      return false;
    }
    console.log('Cadena reemplazada por una más larga y válida.');
    this.chain = newChain;
    return true;
  }
}

// ========== SIMULACIÓN DE RED SIMPLE ==========
class Node {
  constructor(name) {
    this.name = name;
    this.blockchain = new Blockchain();
    this.peers = [];
  }

  connect(peer) {
    if (!this.peers.includes(peer)) {
      this.peers.push(peer);
      peer.peers.push(this); // bidireccional simple
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
      console.log(`  → Enviando a ${peer.name}`);
      peer.receiveChain(this.blockchain.chain);
    }
  }

  receiveChain(newChain) {
    console.log(`[${this.name}] Recibida cadena de longitud ${newChain.length}`);
    const adopted = this.blockchain.replaceChain(newChain);
    if (adopted) {
      console.log(`[${this.name}] Adoptada. Nueva longitud: ${this.blockchain.chain.length}`);
      // Opcional: re-propagar para que llegue más lejos (en esta demo simple no lo hacemos para evitar bucles)
    }
  }

  status() {
    return {
      name: this.name,
      length: this.blockchain.chain.length,
      valid: this.blockchain.isChainValid()
    };
  }
}

// ========== DEMO / PRUEBAS ==========
console.log('=== JScoin Lab - Práctica 5: Redes y propagación básica ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

// Wallets
const aliceKey = ec.genKeyPair();
const aliceAddress = aliceKey.getPublic('hex');
const bobKey = ec.genKeyPair();
const bobAddress = bobKey.getPublic('hex');

// Crear nodos
const nodeA = new Node('Nodo-A');
const nodeB = new Node('Nodo-B');
const nodeC = new Node('Nodo-C');

// Conectar en una pequeña red (A-B, B-C)
nodeA.connect(nodeB);
nodeB.connect(nodeC);

console.log('Red creada: A ↔ B ↔ C\n');

// Estado inicial
console.log('--- Estado inicial ---');
[nodeA, nodeB, nodeC].forEach(n => console.log(n.status()));

// Nodo A mina dos bloques
nodeA.mine(aliceAddress);
nodeA.mine(aliceAddress);

console.log('\n--- Después de que A mina y propaga ---');
[nodeA, nodeB, nodeC].forEach(n => {
  const s = n.status();
  console.log(`${s.name}: longitud=${s.length}, válida=${s.valid}, saldo Alice=${n.blockchain.getBalanceOfAddress(aliceAddress)}`);
});

// Nodo C mina uno más (debería propagarse de vuelta)
console.log('\n--- Nodo C mina un bloque extra ---');
nodeC.mine(bobAddress);

console.log('\n--- Estado final ---');
[nodeA, nodeB, nodeC].forEach(n => {
  const s = n.status();
  console.log(`${s.name}: longitud=${s.length}, válida=${s.valid}`);
  console.log(`  Saldo Alice: ${n.blockchain.getBalanceOfAddress(aliceAddress)}`);
  console.log(`  Saldo Bob:   ${n.blockchain.getBalanceOfAddress(bobAddress)}`);
});

console.log('\n¿Todas las cadenas son válidas?', 
  nodeA.blockchain.isChainValid() && 
  nodeB.blockchain.isChainValid() && 
  nodeC.blockchain.isChainValid());
