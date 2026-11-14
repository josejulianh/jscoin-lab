// JScoin - Semana/Día 18: Estimación de fees basada en bloques confirmados y simulación de congestión
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: fee rate real por vsize, datos históricos reales de la red, mempool de producción, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount, fee = 0, size = 200) {
    if (amount <= 0) throw new Error('El importe debe ser positivo');
    if (fee < 0) throw new Error('La fee no puede ser negativa');
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.fee = fee;
    this.size = size; // tamaño simulado en "bytes" educativos
    this.timestamp = Date.now();
    this.signature = null;
    this.id = crypto.randomBytes(8).toString('hex');
  }

  getFeeRate() {
    return this.fee / Math.max(1, this.size);
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.fee + this.size + this.timestamp + this.id)
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

  getConfirmedFeeRates() {
    return this.transactions
      .filter(tx => tx.fromAddress !== null) // excluir coinbase
      .map(tx => tx.getFeeRate());
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = []; // mempool educativo
    this.miningReward = 50;
    this.minFeeRate = 0.001;
    this.mempoolLimit = 5;
    this.maxTxsPerBlock = 3; // límite educativo de congestión
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
    for (const tx of this.pendingTransactions) {
      if (tx.fromAddress === address) balance -= tx.totalCost();
    }
    return Math.max(0, balance);
  }

  // Estimación basada en fee rates de transacciones confirmadas en los últimos N bloques
  estimateFeeFromConfirmed(blocksToLook = 3, percentile = 0.7) {
    const recentRates = [];
    const start = Math.max(1, this.chain.length - blocksToLook);
    for (let i = start; i < this.chain.length; i++) {
      recentRates.push(...this.chain[i].getConfirmedFeeRates());
    }
    if (recentRates.length === 0) return 1; // fee mínima por defecto

    recentRates.sort((a, b) => a - b);
    const idx = Math.min(recentRates.length - 1, Math.floor(recentRates.length * percentile));
    const suggestedRate = recentRates[idx] * 1.15; // un poco por encima del percentil
    const typicalSize = 220;
    return Math.max(1, Math.ceil(suggestedRate * typicalSize));
  }

  estimateFee(desiredRate = null) {
    // Combina estimación de mempool y de confirmados
    const fromMempool = this.pendingTransactions.length > 0
      ? (() => {
          const rates = this.pendingTransactions.map(tx => tx.getFeeRate()).sort((a, b) => b - a);
          return (rates[Math.floor(rates.length / 2)] || 0.01) * 1.1;
        })()
      : 0.01;

    const fromConfirmed = (() => {
      const fee = this.estimateFeeFromConfirmed();
      return fee / 220;
    })();

    const suggestedRate = desiredRate || Math.max(fromMempool, fromConfirmed);
    const typicalSize = 220;
    return Math.max(1, Math.ceil(suggestedRate * typicalSize));
  }

  addTransaction(tx) {
    if (!tx.isValid()) {
      throw new Error('Transacción no válida (firma o montos)');
    }
    const rate = tx.getFeeRate();
    if (rate < this.minFeeRate) {
      throw new Error(`Fee rate insuficiente. Mínimo: ${this.minFeeRate}, ofrecido: ${rate.toFixed(6)}`);
    }

    const available = this.getBalanceOfAddress(tx.fromAddress);
    if (available < tx.totalCost()) {
      throw new Error(`Saldo insuficiente (incluyendo fee). Disponible: ${available}, necesario: ${tx.totalCost()}`);
    }

    if (this.pendingTransactions.length >= this.mempoolLimit) {
      let worstIdx = 0;
      let worstRate = this.pendingTransactions[0].getFeeRate();
      for (let i = 1; i < this.pendingTransactions.length; i++) {
        const r = this.pendingTransactions[i].getFeeRate();
        if (r < worstRate) {
          worstRate = r;
          worstIdx = i;
        }
      }
      if (rate > worstRate) {
        const evicted = this.pendingTransactions.splice(worstIdx, 1)[0];
        console.log(`Eviction: expulsada tx ${evicted.id.substring(0, 8)}... (feeRate=${worstRate.toFixed(6)}) para hacer espacio a mejor rate=${rate.toFixed(6)}`);
      } else {
        throw new Error('Mempool lleno y esta tx no mejora el peor fee rate');
      }
    }

    this.pendingTransactions.push(tx);
    console.log(`Tx añadida. ID=${tx.id.substring(0, 8)}... fee=${tx.fee} size=${tx.size} rate=${rate.toFixed(6)}`);
    return true;
  }

  minePendingTransactions(miningRewardAddress) {
    const sorted = [...this.pendingTransactions].sort((a, b) => b.getFeeRate() - a.getFeeRate());
    console.log('Mempool ordenado por fee rate (mayor a menor):');
    sorted.forEach((tx, i) => {
      console.log(`  ${i + 1}. rate=${tx.getFeeRate().toFixed(6)} fee=${tx.fee} amount=${tx.amount} id=${tx.id.substring(0, 8)}...`);
    });

    // Simulación de congestión: solo se incluyen las mejores N txs
    const selected = sorted.slice(0, this.maxTxsPerBlock);
    const remaining = sorted.slice(this.maxTxsPerBlock);
    if (remaining.length > 0) {
      console.log(`Congestión: ${remaining.length} tx(s) no caben en este bloque y permanecen en mempool.`);
    }

    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 0, 100);
    const blockTxs = [rewardTx, ...selected];

    const block = new Block(
      Date.now(),
      blockTxs,
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();
    this.chain.push(block);
    this.pendingTransactions = remaining; // las no seleccionadas se quedan
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

  createTransaction(toAddress, amount, fee = 1, size = 200) {
    const tx = new Transaction(this.address, toAddress, amount, fee, size);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 18: Estimación basada en confirmados y congestión ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();
const miner = new Wallet();

const jscoin = new Blockchain();
jscoin.mempoolLimit = 6;
jscoin.maxTxsPerBlock = 2;

console.log('1. Minando recompensa para Alice...');
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

console.log('2. Estimación inicial (sin datos):', jscoin.estimateFee());
console.log('   Estimación solo confirmados:', jscoin.estimateFeeFromConfirmed());

console.log('\n3. Añadiendo transacciones y minando un bloque con fees...');
try {
  jscoin.addTransaction(alice.createTransaction(bob.address, 10, 5, 200));
  jscoin.addTransaction(alice.createTransaction(bob.address, 8, 3, 180));
  jscoin.addTransaction(alice.createTransaction(bob.address, 6, 8, 220));
} catch (e) {
  console.log('Aviso:', e.message);
}
jscoin.minePendingTransactions(miner.address);
console.log(`Saldo Alice después: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

console.log('4. Nueva estimación después de confirmaciones:');
console.log('   estimateFee():', jscoin.estimateFee());
console.log('   estimateFeeFromConfirmed():', jscoin.estimateFeeFromConfirmed());

console.log('\n5. Simulando congestión: añadiendo más txs de las que caben en un bloque...');
try {
  for (let i = 0; i < 5; i++) {
    const fee = 2 + i * 2;
    jscoin.addTransaction(alice.createTransaction(bob.address, 2, fee, 200));
  }
} catch (e) {
  console.log('Aviso durante añadido:', e.message);
}

console.log('\n6. Minando con límite de congestión...');
jscoin.minePendingTransactions(miner.address);
console.log(`Txs restantes en mempool: ${jscoin.pendingTransactions.length}`);
console.log(`Saldo Alice final: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo Bob: ${jscoin.getBalanceOfAddress(bob.address)}`);
console.log(`Saldo Miner: ${jscoin.getBalanceOfAddress(miner.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}`);
console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo de estimación de fees y congestión. En Bitcoin real se usan datos de red en tiempo real y políticas complejas.');
