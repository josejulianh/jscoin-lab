// JScoin - Semana/Día 24: Reorganizaciones de cadena (reorgs) y bloques huérfanos educativos
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Extiende el consenso básico con una simulación simple de bifurcaciones, bloques huérfanos y reorg.
// No implementa red P2P real, chainwork real, ni protecciones de producción contra reorgs.

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
  constructor(timestamp, transactions, previousHash = '', difficulty = 2) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = this.calculateHash();
    this.work = 1; // Trabajo simplificado (1 por bloque en este prototipo)
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
    this.pendingTransactions = [];
    this.miningReward = 50;
    this.orphanBlocks = []; // Bloques huérfanos detectados
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
      this.difficulty
    );
    block.mineBlock();
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  // Calcula el trabajo acumulado simplificado de una cadena
  getChainWork(chain) {
    return chain.reduce((sum, block) => sum + (block.work || 1), 0);
  }

  // Simula la recepción de un bloque alternativo (posible bifurcación)
  receiveAlternativeBlock(block) {
    const latest = this.getLatestBlock();
    if (block.previousHash === latest.previousHash) {
      // Bifurcación: mismo padre
      console.log(`Bifurcación detectada. Bloque alternativo recibido (hash: ${block.hash.substring(0, 10)}...)`);
      return true;
    }
    return false;
  }

  // Realiza un reorg simple: adopta la cadena con más trabajo
  performReorg(alternativeChain) {
    const currentWork = this.getChainWork(this.chain);
    const altWork = this.getChainWork(alternativeChain);

    console.log(`Trabajo cadena actual: ${currentWork}`);
    console.log(`Trabajo cadena alternativa: ${altWork}`);

    if (altWork > currentWork) {
      console.log('¡Reorg! Adoptando la cadena con más trabajo...');
      // Guardar bloques de la cadena antigua como huérfanos (simplificado)
      const commonLength = Math.min(this.chain.length, alternativeChain.length);
      for (let i = commonLength; i < this.chain.length; i++) {
        this.orphanBlocks.push(this.chain[i]);
        // Devolver transacciones al mempool (simulado)
        for (const tx of this.chain[i].transactions) {
          if (tx.fromAddress !== null) {
            this.pendingTransactions.push(tx);
          }
        }
      }
      this.chain = alternativeChain;
      return true;
    } else {
      console.log('La cadena actual tiene más o igual trabajo. No se realiza reorg.');
      // El bloque alternativo se convierte en huérfano
      if (alternativeChain.length > this.chain.length) {
        // No debería pasar, pero por si acaso
      } else {
        this.orphanBlocks.push(alternativeChain[alternativeChain.length - 1]);
      }
      return false;
    }
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

  getOrphanBlocks() {
    return this.orphanBlocks;
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
console.log('=== JScoin Lab - Práctica 24: Reorgs y bloques huérfanos educativos ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const minerA = new Wallet();
const minerB = new Wallet();
const user = new Wallet();

const jscoin = new Blockchain();

console.log('1. Construyendo cadena principal (3 bloques)...');
jscoin.minePendingTransactions(minerA.address);
jscoin.minePendingTransactions(minerA.address);
jscoin.minePendingTransactions(minerA.address);
console.log(`Longitud cadena: ${jscoin.chain.length}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

console.log('2. Simulando bifurcación: dos mineros encuentran un bloque casi a la vez...');
// Clonamos el estado actual para crear una rama alternativa
const alternativeChain = [...jscoin.chain];
const altBlock = new Block(
  Date.now(),
  [new Transaction(null, minerB.address, 50)],
  jscoin.getLatestBlock().previousHash, // mismo padre
  2
);
altBlock.mineBlock();
alternativeChain.push(altBlock);

console.log('Cadena principal tiene un bloque más...');
const mainExtra = new Block(
  Date.now(),
  [new Transaction(null, minerA.address, 50)],
  jscoin.getLatestBlock().hash,
  2
);
mainExtra.mineBlock();
jscoin.chain.push(mainExtra);

console.log(`Longitud principal: ${jscoin.chain.length}`);
console.log(`Longitud alternativa: ${alternativeChain.length}\n`);

console.log('3. Añadiendo más trabajo a la cadena alternativa para forzar reorg...');
const altExtra = new Block(
  Date.now(),
  [new Transaction(null, minerB.address, 50)],
  altBlock.hash,
  2
);
altExtra.mineBlock();
alternativeChain.push(altExtra);

console.log('4. Realizando reorg...');
const didReorg = jscoin.performReorg(alternativeChain);
console.log(`¿Se realizó reorg? ${didReorg}`);
console.log(`Nueva longitud de cadena: ${jscoin.chain.length}`);
console.log(`Bloques huérfanos: ${jscoin.getOrphanBlocks().length}`);
console.log(`Cadena válida después del reorg: ${jscoin.isChainValid()}`);
console.log(`Transacciones devueltas al mempool: ${jscoin.pendingTransactions.length}`);

console.log('\n--- Fin de la práctica 24 ---');
console.log('Recuerda: esto es solo un prototipo educativo. Los reorgs reales en Bitcoin');
console.log('usan chainwork acumulado, propagación P2P y tienen protecciones contra reorgs profundos.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
