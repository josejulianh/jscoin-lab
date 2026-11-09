// JScoin - Semana/Día 14: Simulación multi-nodo educativa
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: red P2P real, sockets, descubrimiento de peers, seguridad de red, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// ---------- Clases base (simplificadas de prácticas anteriores) ----------

class Transaction {
  constructor(inputs = [], outputs = []) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.timestamp = Date.now();
    this.id = crypto.randomBytes(16).toString('hex');
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this.inputs) + JSON.stringify(this.outputs) + this.timestamp + this.id)
      .digest('hex');
  }

  signInputs(signingKey) {
    const publicKey = signingKey.getPublic('hex');
    const hash = this.calculateHash();
    const signature = signingKey.sign(hash, 'base64').toDER('hex');
    this.inputs.forEach(input => {
      input.signature = signature;
      input.publicKey = publicKey;
    });
  }

  isValid(utxoSet) {
    if (this.inputs.length === 0) {
      return this.outputs.length === 1 && this.outputs[0].amount > 0;
    }
    let inputSum = 0;
    for (const input of this.inputs) {
      const utxo = utxoSet.get(input.txId + ':' + input.outputIndex);
      if (!utxo) return false;
      if (utxo.address !== input.publicKey) return false;
      if (!input.signature) return false;
      const key = ec.keyFromPublic(input.publicKey, 'hex');
      if (!key.verify(this.calculateHash(), input.signature)) return false;
      inputSum += utxo.amount;
    }
    const outputSum = this.outputs.reduce((sum, o) => sum + o.amount, 0);
    if (outputSum > inputSum) return false;
    return true;
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
    const start = Date.now();
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`  [Miner] Bloque minado: ${this.hash.substring(0, 16)}... (${Date.now() - start}ms)`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 50;
    this.utxoSet = new Map();
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  createCoinbase(address) {
    return new Transaction([], [{ address, amount: this.miningReward }]);
  }

  addTransaction(tx) {
    if (!tx.isValid(this.utxoSet)) {
      throw new Error('Transacción no válida');
    }
    this.pendingTransactions.push(tx);
  }

  updateUTXOSet(block) {
    for (const tx of block.transactions) {
      for (const input of tx.inputs) {
        this.utxoSet.delete(input.txId + ':' + input.outputIndex);
      }
      tx.outputs.forEach((output, index) => {
        this.utxoSet.set(tx.id + ':' + index, {
          address: output.address,
          amount: output.amount
        });
      });
    }
  }

  minePendingTransactions(miningRewardAddress) {
    const coinbase = this.createCoinbase(miningRewardAddress);
    const block = new Block(
      Date.now(),
      [coinbase, ...this.pendingTransactions],
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();
    this.updateUTXOSet(block);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    for (const [, utxo] of this.utxoSet) {
      if (utxo.address === address) balance += utxo.amount;
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }

  // Reemplaza la cadena si la recibida es más larga y válida
  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) return false;
    // Validación simplificada (en un sistema real se validarían todas las txs y UTXOs)
    const temp = new Blockchain();
    temp.chain = newChain;
    if (!temp.isChainValid()) return false;
    this.chain = newChain;
    // Reconstruir UTXO set (simplificado: solo para demo)
    this.utxoSet = new Map();
    for (const block of this.chain.slice(1)) {
      this.updateUTXOSet(block);
    }
    return true;
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }
}

// ---------- Simulación de red multi-nodo ----------

class Node {
  constructor(name) {
    this.name = name;
    this.blockchain = new Blockchain();
    this.peers = [];
  }

  connect(otherNode) {
    if (!this.peers.includes(otherNode)) this.peers.push(otherNode);
    if (!otherNode.peers.includes(this)) otherNode.peers.push(this);
  }

  // Propagar transacción a peers
  broadcastTransaction(tx) {
    console.log(`[${this.name}] Propagando TX ${tx.id.substring(0, 8)}...`);
    for (const peer of this.peers) {
      peer.receiveTransaction(tx, this);
    }
  }

  receiveTransaction(tx, fromNode) {
    try {
      // Evitar duplicados simples
      if (this.blockchain.pendingTransactions.some(t => t.id === tx.id)) return;
      this.blockchain.addTransaction(tx);
      console.log(`[${this.name}] Aceptó TX de ${fromNode.name}`);
      // Re-propagar (gossip simple, con límite para evitar bucles infinitos en demo)
      this.broadcastTransaction(tx);
    } catch (e) {
      console.log(`[${this.name}] Rechazó TX: ${e.message}`);
    }
  }

  // Minar y propagar bloque
  mineAndBroadcast(miningAddress) {
    console.log(`\n[${this.name}] Minando bloque...`);
    const block = this.blockchain.minePendingTransactions(miningAddress);
    this.broadcastBlock(block);
    return block;
  }

  broadcastBlock(block) {
    console.log(`[${this.name}] Propagando bloque ${block.hash.substring(0, 16)}...`);
    for (const peer of this.peers) {
      peer.receiveBlock(block, this);
    }
  }

  receiveBlock(block, fromNode) {
    const latest = this.blockchain.getLatestBlock();
    if (block.previousHash !== latest.hash) {
      // Cadena más larga potencial: en demo simple pedimos la cadena completa
      console.log(`[${this.name}] Bloque no encaja, solicitando cadena a ${fromNode.name}`);
      this.receiveChain(fromNode.blockchain.chain, fromNode);
      return;
    }
    // Validación básica
    if (block.hash !== block.calculateHash()) return;
    if (block.hash.substring(0, block.difficulty) !== '0'.repeat(block.difficulty)) return;

    // Aceptar bloque
    this.blockchain.updateUTXOSet(block);
    this.blockchain.chain.push(block);
    this.blockchain.pendingTransactions = [];
    console.log(`[${this.name}] Aceptó bloque de ${fromNode.name}. Altura: ${this.blockchain.chain.length}`);
    // Propagar a otros peers
    this.broadcastBlock(block);
  }

  receiveChain(newChain, fromNode) {
    const replaced = this.blockchain.replaceChain(newChain);
    if (replaced) {
      console.log(`[${this.name}] Reemplazó cadena con la de ${fromNode.name}. Nueva altura: ${this.blockchain.chain.length}`);
    }
  }

  printStatus() {
    console.log(`  [${this.name}] Altura: ${this.blockchain.chain.length}, Válida: ${this.blockchain.isChainValid()}, Mempool: ${this.blockchain.pendingTransactions.length}`);
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 14: Simulación multi-nodo educativa ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();

const nodeA = new Node('Node-A');
const nodeB = new Node('Node-B');
const nodeC = new Node('Node-C');

nodeA.connect(nodeB);
nodeB.connect(nodeC);
nodeA.connect(nodeC); // malla simple

console.log('Nodos conectados: A <-> B <-> C <-> A\n');

// Node-A mina el primer bloque (recompensa para Alice)
nodeA.mineAndBroadcast(alice.address);

console.log('\n--- Estado después del primer bloque ---');
nodeA.printStatus();
nodeB.printStatus();
nodeC.printStatus();

// Crear una transacción en Node-A y propagarla
console.log('\n--- Creando y propagando transacción Alice -> Bob ---');
const utxos = [];
for (const [key, utxo] of nodeA.blockchain.utxoSet) {
  if (utxo.address === alice.address) utxos.push({ key, ...utxo });
}
if (utxos.length > 0) {
  const [txId, idx] = utxos[0].key.split(':');
  const tx = new Transaction(
    [{ txId, outputIndex: parseInt(idx) }],
    [
      { address: bob.address, amount: 20 },
      { address: alice.address, amount: 30 }
    ]
  );
  tx.signInputs(alice.keyPair);
  nodeA.blockchain.addTransaction(tx);
  nodeA.broadcastTransaction(tx);
}

console.log('\n--- Estado de mempools ---');
nodeA.printStatus();
nodeB.printStatus();
nodeC.printStatus();

// Node-B mina el siguiente bloque
nodeB.mineAndBroadcast(bob.address);

console.log('\n--- Estado final ---');
nodeA.printStatus();
nodeB.printStatus();
nodeC.printStatus();

console.log(`\nSaldo Alice en Node-A: ${nodeA.blockchain.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo Bob en Node-B:   ${nodeB.blockchain.getBalanceOfAddress(bob.address)}`);
console.log(`¿Todas las cadenas válidas?: ${nodeA.blockchain.isChainValid() && nodeB.blockchain.isChainValid() && nodeC.blockchain.isChainValid()}`);

console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo de propagación multi-nodo.');
console.log('En una red real se usaría libp2p o similar, con validación completa de UTXOs al sincronizar, rate limiting y protección contra ataques de red.');
