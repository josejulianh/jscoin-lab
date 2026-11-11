// JScoin - Semana/Día 16: Fees básicos educativos y Replace-By-Fee (RBF) simple
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: fee rate real por tamaño, reglas BIP 125 completas, mempool de producción, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount, fee = 0, replaceId = null) {
    if (amount <= 0) throw new Error('El importe debe ser positivo');
    if (fee < 0) throw new Error('La fee no puede ser negativa');
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.fee = fee;
    this.timestamp = Date.now();
    this.signature = null;
    this.id = crypto.randomBytes(8).toString('hex');
    this.replaceId = replaceId; // para RBF educativo: id de la tx a reemplazar
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
    if (this.fromAddress === null) return true; // coinbase
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
    this.pendingTransactions = []; // mempool educativo
    this.miningReward = 50;
    this.minFee = 0; // fee mínima educativa
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
    // También descontar pendientes
    for (const tx of this.pendingTransactions) {
      if (tx.fromAddress === address) balance -= tx.totalCost();
    }
    return Math.max(0, balance);
  }

  addTransaction(tx) {
    if (!tx.isValid()) {
      throw new Error('Transacción no válida (firma o montos)');
    }
    if (tx.fee < this.minFee) {
      throw new Error(`Fee insuficiente. Mínimo: ${this.minFee}, ofrecido: ${tx.fee}`);
    }

    const available = this.getBalanceOfAddress(tx.fromAddress);
    if (available < tx.totalCost()) {
      throw new Error(`Saldo insuficiente (incluyendo fee). Disponible: ${available}, necesario: ${tx.totalCost()}`);
    }

    // RBF educativo simple
    if (tx.replaceId) {
      const idx = this.pendingTransactions.findIndex(p => p.id === tx.replaceId);
      if (idx === -1) {
        throw new Error('No se encontró la transacción a reemplazar');
      }
      const old = this.pendingTransactions[idx];
      if (old.fromAddress !== tx.fromAddress) {
        throw new Error('Solo el emisor puede hacer RBF');
      }
      if (tx.fee <= old.fee) {
        throw new Error('La fee del reemplazo debe ser mayor');
      }
      // Reemplazar
      this.pendingTransactions[idx] = tx;
      console.log(`RBF: reemplazada tx ${tx.replaceId.substring(0, 8)}... por fee mayor (${tx.fee})`);
      return true;
    }

    this.pendingTransactions.push(tx);
    return true;
  }

  // Prioriza por fee descendente al minar
  minePendingTransactions(miningRewardAddress) {
    // Ordenar pendientes por fee (mayor primero)
    const sorted = [...this.pendingTransactions].sort((a, b) => b.fee - a.fee);
    console.log('Mempool ordenado por fee (mayor a menor):');
    sorted.forEach((tx, i) => {
      console.log(`  ${i + 1}. fee=${tx.fee} amount=${tx.amount} id=${tx.id.substring(0, 8)}...`);
    });

    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 0);
    const blockTxs = [rewardTx, ...sorted];

    const block = new Block(
      Date.now(),
      blockTxs,
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
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }

  createTransaction(toAddress, amount, fee = 1, replaceId = null) {
    const tx = new Transaction(this.address, toAddress, amount, fee, replaceId);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 16: Fees y RBF educativo ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();
const miner = new Wallet();

const jscoin = new Blockchain();

console.log('1. Minando recompensa para Alice...');
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

console.log('2. Alice crea tx con fee baja (1) hacia Bob...');
const lowFeeTx = alice.createTransaction(bob.address, 20, 1);
jscoin.addTransaction(lowFeeTx);
console.log(`Tx añadida. ID: ${lowFeeTx.id.substring(0, 8)}... fee=${lowFeeTx.fee}`);

console.log('\n3. Alice hace RBF: reemplaza con fee más alta (5)...');
const highFeeTx = alice.createTransaction(bob.address, 20, 5, lowFeeTx.id);
jscoin.addTransaction(highFeeTx);

console.log('\n4. Alice intenta otra tx con fee aún más alta (pero saldo limitado)...');
try {
  const tooHigh = alice.createTransaction(bob.address, 30, 10);
  jscoin.addTransaction(tooHigh);
  console.log('Añadida (si había saldo)');
} catch (e) {
  console.log('✓ Correctamente rechazada por saldo:', e.message);
}

console.log('\n5. Minando bloque (se prioriza por fee)...');
jscoin.minePendingTransactions(miner.address);
console.log(`Saldo Alice final: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo Bob: ${jscoin.getBalanceOfAddress(bob.address)}`);
console.log(`Saldo Miner: ${jscoin.getBalanceOfAddress(miner.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}`);
console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo de fees y RBF. En Bitcoin real las reglas son mucho más complejas (fee rate, BIP 125, mempool, etc.).');
