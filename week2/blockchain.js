// JScoin - Semana/Día 2: Prueba de Trabajo (Proof-of-Work) simple
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: firmas, red P2P, consenso real, recompensas, dificultad adaptativa, etc.

const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
      )
      .digest('hex');
  }

  // Prueba de trabajo: encuentra un nonce tal que el hash empiece por '0'.repeat(difficulty)
  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    const start = Date.now();

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    const time = Date.now() - start;
    console.log(`Bloque minado: ${this.hash} (nonce: ${this.nonce}, tiempo: ${time}ms)`);
  }
}

class Blockchain {
  constructor(difficulty = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  createGenesisBlock() {
    const genesis = new Block(0, Date.now(), 'Genesis Block', '0');
    // El genesis también se mina para consistencia
    genesis.mineBlock(this.difficulty || 2);
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // El hash debe ser correcto y cumplir la dificultad
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (current.hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) return false;
    }
    return true;
  }
}

// ========== DEMO / PRUEBAS ==========
console.log('=== JScoin Lab - Práctica 2: PoW ===');
console.log('PROTOTIPO EDUCATIVO - No usar en producción\n');

const difficulty = 3; // Prueba con 2, 3 o 4 (4 ya tarda bastante)
const jscoin = new Blockchain(difficulty);

console.log('Minando bloque 1...');
jscoin.addBlock(new Block(1, Date.now(), { from: 'Alice', to: 'Bob', amount: 5 }));

console.log('Minando bloque 2...');
jscoin.addBlock(new Block(2, Date.now(), { from: 'Bob', to: 'Charlie', amount: 2 }));

console.log('\nCadena completa:');
console.log(JSON.stringify(jscoin, null, 2));

console.log('\n¿Cadena válida?', jscoin.isChainValid());

// Prueba de alteración (debe fallar)
console.log('\n--- Prueba de alteración ---');
jscoin.chain[1].data.amount = 999;
console.log('¿Cadena válida después de alterar datos?', jscoin.isChainValid());
