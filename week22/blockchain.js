// JScoin - Semana/Día 22: Canales de pago educativos básicos
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Simula el concepto de payment channels (inspirado en Lightning) a nivel de aplicación.
// No implementa el protocolo Lightning real, BOLT, penalty transactions, etc.

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

  createTransaction(toAddress, amount, fee = 1) {
    const tx = new Transaction(this.address, toAddress, amount, fee);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== Canal de pago educativo ==========
class PaymentChannel {
  constructor(alice, bob, capacity, blockchain) {
    this.alice = alice;
    this.bob = bob;
    this.capacity = capacity;
    this.aliceBalance = capacity;
    this.bobBalance = 0;
    this.stateVersion = 0;
    this.isOpen = false;
    this.blockchain = blockchain;
    this.fundingTx = null;
  }

  open() {
    // Simula funding: Alice envía capacity al canal (on-chain)
    this.fundingTx = this.alice.createTransaction(this.bob.address, this.capacity, 1);
    this.blockchain.addTransaction(this.fundingTx);
    this.blockchain.minePendingTransactions(this.alice.address);
    this.isOpen = true;
    this.stateVersion = 1;
    console.log(`Canal abierto. Capacidad: ${this.capacity}. Estado v${this.stateVersion}`);
  }

  updateState(fromAlice, amount) {
    if (!this.isOpen) throw new Error('Canal cerrado');
    if (fromAlice) {
      if (this.aliceBalance < amount) throw new Error('Saldo insuficiente de Alice');
      this.aliceBalance -= amount;
      this.bobBalance += amount;
    } else {
      if (this.bobBalance < amount) throw new Error('Saldo insuficiente de Bob');
      this.bobBalance -= amount;
      this.aliceBalance += amount;
    }
    this.stateVersion++;
    console.log(`Actualización off-chain v${this.stateVersion}: Alice=${this.aliceBalance}, Bob=${this.bobBalance}`);
    return this.stateVersion;
  }

  close() {
    if (!this.isOpen) throw new Error('Canal ya cerrado');
    // Liquida el estado final on-chain (simulado)
    console.log(`Cerrando canal. Liquidando estado final v${this.stateVersion}`);
    console.log(`  Alice recibe de vuelta: ${this.aliceBalance}`);
    console.log(`  Bob se queda con: ${this.bobBalance}`);
    this.isOpen = false;
    return { alice: this.aliceBalance, bob: this.bobBalance, version: this.stateVersion };
  }

  getBalances() {
    return { alice: this.aliceBalance, bob: this.bobBalance, version: this.stateVersion, open: this.isOpen };
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 22: Canales de pago educativos básicos ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();
const miner = new Wallet();

const jscoin = new Blockchain();

console.log('1. Minando recompensas iniciales...');
jscoin.minePendingTransactions(alice.address);
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice on-chain: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

console.log('2. Abriendo canal de pago Alice ↔ Bob (capacidad 40)...');
const channel = new PaymentChannel(alice, bob, 40, jscoin);
channel.open();
console.log(`Balances del canal:`, channel.getBalances());
console.log(`Saldo Alice on-chain tras funding: ${jscoin.getBalanceOfAddress(alice.address)}\n`);

console.log('3. Actualizaciones off-chain (simulando varios pagos)...');
channel.updateState(true, 10);   // Alice → Bob 10
channel.updateState(true, 5);    // Alice → Bob 5
channel.updateState(false, 3);   // Bob → Alice 3
console.log(`Balances actuales:`, channel.getBalances());

console.log('\n4. Cerrando el canal y liquidando estado final...');
const finalState = channel.close();
console.log('Estado final liquidado:', finalState);

console.log(`\nCadena válida final: ${jscoin.isChainValid()}`);
console.log(`Número de bloques: ${jscoin.chain.length}`);

console.log('\n--- Fin de la práctica 22 ---');
console.log('Recuerda: esto es solo un prototipo educativo. Lightning Network real usa HTLCs, penalty transactions, watchtowers y el protocolo BOLT.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
