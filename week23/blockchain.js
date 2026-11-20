// JScoin - Semana/Día 23: Watchtowers educativos básicos
// PROTOTIPO EDUCATIVO. NO apto para producción.
// Extiende el concepto de canales de pago (práctica 22) con una simulación simple de watchtower
// para detectar intentos de cierre con estados antiguos.
// No implementa el protocolo Lightning real, BOLT, penalty transactions, watchtowers reales, etc.

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

// ========== Canal de pago educativo con Watchtower simple ==========
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
    this.states = []; // Historial de estados firmados (simulado)
  }

  open() {
    this.fundingTx = this.alice.createTransaction(this.bob.address, this.capacity, 1);
    this.blockchain.addTransaction(this.fundingTx);
    this.blockchain.minePendingTransactions(this.alice.address);
    this.isOpen = true;
    this.stateVersion = 1;
    this.recordState();
    console.log(`Canal abierto. Capacidad: ${this.capacity}. Estado v${this.stateVersion}`);
  }

  recordState() {
    const state = {
      version: this.stateVersion,
      aliceBalance: this.aliceBalance,
      bobBalance: this.bobBalance,
      timestamp: Date.now()
    };
    this.states.push(state);
    return state;
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
    const state = this.recordState();
    console.log(`Actualización off-chain v${this.stateVersion}: Alice=${this.aliceBalance}, Bob=${this.bobBalance}`);
    return state;
  }

  getLatestState() {
    return this.states[this.states.length - 1];
  }

  close(withStateVersion = null) {
    if (!this.isOpen) throw new Error('Canal ya cerrado');
    const targetVersion = withStateVersion || this.stateVersion;
    const targetState = this.states.find(s => s.version === targetVersion);
    if (!targetState) throw new Error('Estado no encontrado');

    console.log(`Intentando cerrar canal con estado v${targetVersion}`);
    console.log(`  Alice: ${targetState.aliceBalance}, Bob: ${targetState.bobBalance}`);

    this.isOpen = false;
    return targetState;
  }

  getBalances() {
    return { alice: this.aliceBalance, bob: this.bobBalance, version: this.stateVersion, open: this.isOpen };
  }
}

// Watchtower educativo simple
class Watchtower {
  constructor(channel) {
    this.channel = channel;
    this.knownLatestVersion = channel.stateVersion;
    this.alerts = [];
  }

  monitor() {
    const latest = this.channel.getLatestState();
    if (latest && latest.version > this.knownLatestVersion) {
      this.knownLatestVersion = latest.version;
    }
    return this.knownLatestVersion;
  }

  // Detecta si alguien intenta cerrar con un estado antiguo
  checkCloseAttempt(closedWithVersion) {
    if (closedWithVersion < this.knownLatestVersion) {
      const alert = {
        type: 'OLD_STATE_CLOSE_ATTEMPT',
        attemptedVersion: closedWithVersion,
        latestKnown: this.knownLatestVersion,
        message: `¡Alerta! Intento de cierre con estado antiguo (v${closedWithVersion}). El último conocido es v${this.knownLatestVersion}.`
      };
      this.alerts.push(alert);
      console.log(`\n[WATCHTOWER] ${alert.message}`);
      return false; // Rechazado
    }
    console.log(`[WATCHTOWER] Cierre con estado válido v${closedWithVersion} aceptado.`);
    return true;
  }

  getAlerts() {
    return this.alerts;
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 23: Watchtowers educativos básicos ===');
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

const watchtower = new Watchtower(channel);
watchtower.monitor();

console.log('3. Actualizaciones off-chain...');
channel.updateState(true, 10);
watchtower.monitor();
channel.updateState(true, 5);
watchtower.monitor();
channel.updateState(false, 3);
watchtower.monitor();
console.log(`Balances actuales:`, channel.getBalances());
console.log(`Último estado conocido por watchtower: v${watchtower.knownLatestVersion}\n`);

console.log('4. Intento de cierre malicioso con estado antiguo (v2)...');
const oldStateAttempt = channel.close(2);
const acceptedOld = watchtower.checkCloseAttempt(2);
console.log(`¿Cierre con estado antiguo aceptado por watchtower? ${acceptedOld}`);

console.log('\n5. Cierre correcto con el último estado...');
// Reabrimos conceptualmente para la demo (en prototipo educativo)
channel.isOpen = true;
const latestState = channel.close();
const acceptedLatest = watchtower.checkCloseAttempt(latestState.version);
console.log(`¿Cierre con último estado aceptado? ${acceptedLatest}`);
console.log('Estado final:', latestState);

console.log(`\nCadena válida final: ${jscoin.isChainValid()}`);
console.log(`Alertas del watchtower:`, watchtower.getAlerts().length);

console.log('\n--- Fin de la práctica 23 ---');
console.log('Recuerda: esto es solo un prototipo educativo. Los watchtowers reales en Lightning Network');
console.log('monitorizan la cadena, reaccionan con penalty transactions y usan el protocolo BOLT.');
console.log('Repositorio: https://github.com/josejulianh/jscoin-lab');
