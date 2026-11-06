// JScoin - Semana/Día 11: Árboles de Merkle y verificación SPV educativa
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: formato Merkle de Bitcoin real, red P2P, UTXO formal, seguridad de producción, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    if (amount <= 0) throw new Error('El importe debe ser positivo');
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
    if (!this.signature || this.signature.length === 0) return false;
    if (this.amount <= 0) return false;
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

// ========== MERKLE TREE EDUCATIVO ==========
class MerkleTree {
  constructor(transactions) {
    this.leaves = transactions.map(tx => tx.calculateHash());
    this.levels = this.buildTree(this.leaves);
    this.root = this.levels.length > 0 ? this.levels[this.levels.length - 1][0] : crypto.createHash('sha256').update('').digest('hex');
  }

  buildTree(leaves) {
    if (leaves.length === 0) return [];
    const levels = [leaves.slice()];
    let current = leaves.slice();

    while (current.length > 1) {
      const next = [];
      for (let i = 0; i < current.length; i += 2) {
        const left = current[i];
        const right = i + 1 < current.length ? current[i + 1] : left; // duplica si impar (simplificado)
        const parent = crypto.createHash('sha256').update(left + right).digest('hex');
        next.push(parent);
      }
      levels.push(next);
      current = next;
    }
    return levels;
  }

  getProof(txHash) {
    const proof = [];
    let index = this.leaves.indexOf(txHash);
    if (index === -1) return null;

    for (let level = 0; level < this.levels.length - 1; level++) {
      const currentLevel = this.levels[level];
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      const sibling = siblingIndex < currentLevel.length ? currentLevel[siblingIndex] : currentLevel[index];
      proof.push({ hash: sibling, isRight });
      index = Math.floor(index / 2);
    }
    return proof;
  }

  static verifyProof(txHash, proof, root) {
    let hash = txHash;
    for (const step of proof) {
      if (step.isRight) {
        hash = crypto.createHash('sha256').update(step.hash + hash).digest('hex');
      } else {
        hash = crypto.createHash('sha256').update(hash + step.hash).digest('hex');
      }
    }
    return hash === root;
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '', difficulty = 2) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.merkleRoot = new MerkleTree(transactions).root;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
        this.timestamp +
        this.merkleRoot +
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
    console.log(`Merkle root: ${this.merkleRoot.substring(0, 16)}...`);
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) return false;
    }
    // Verificar que el Merkle root coincide
    const tree = new MerkleTree(this.transactions);
    return tree.root === this.merkleRoot;
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
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
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
    return block;
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) throw new Error('from/to requeridos');
    if (!transaction.isValid()) throw new Error('Transacción no válida');
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
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }

  createTransaction(toAddress, amount) {
    const tx = new Transaction(this.address, toAddress, amount);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 11: Árboles de Merkle ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const jscoin = new Blockchain();
const walletA = new Wallet();
const walletB = new Wallet();

// Minar recompensa inicial
jscoin.minePendingTransactions(walletA.address);
console.log(`Saldo A tras minar: ${jscoin.getBalanceOfAddress(walletA.address)}\n`);

// Crear varias transacciones
const tx1 = walletA.createTransaction(walletB.address, 20);
const tx2 = walletA.createTransaction(walletB.address, 15);
const tx3 = walletA.createTransaction(walletB.address, 10);
jscoin.addTransaction(tx1);
jscoin.addTransaction(tx2);
jscoin.addTransaction(tx3);

const block = jscoin.minePendingTransactions(walletA.address);

// Demostrar Merkle
const tree = new MerkleTree(block.transactions);
console.log('\n=== Árbol de Merkle ===');
console.log('Hojas (hashes de tx):');
tree.leaves.forEach((h, i) => console.log(`  [${i}] ${h.substring(0, 16)}...`));
console.log(`Raíz: ${tree.root.substring(0, 16)}...`);

// Generar y verificar prueba para la primera transacción
const targetTx = block.transactions[0];
const proof = tree.getProof(targetTx.calculateHash());
console.log('\nPrueba de Merkle para tx0:');
proof.forEach((p, i) => console.log(`  ${i}: ${p.hash.substring(0, 16)}... (isRight: ${p.isRight})`));

const isValidProof = MerkleTree.verifyProof(targetTx.calculateHash(), proof, tree.root);
console.log(`¿Prueba válida?: ${isValidProof}`);

// Alterar y verificar que falla
const originalAmount = targetTx.amount;
targetTx.amount = 999;
const isValidAfterTamper = MerkleTree.verifyProof(targetTx.calculateHash(), proof, tree.root);
console.log(`¿Prueba válida después de alterar importe?: ${isValidAfterTamper}`);
targetTx.amount = originalAmount; // restaurar

console.log(`\n¿Cadena válida?: ${jscoin.isChainValid()}`);
console.log(`Saldo final A: ${jscoin.getBalanceOfAddress(walletA.address)}`);
console.log(`Saldo final B: ${jscoin.getBalanceOfAddress(walletB.address)}`);

console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo. En producción el Merkle tree usa formato específico de Bitcoin,');
console.log('doble SHA-256, y se combina con red P2P, UTXO, etc.');
