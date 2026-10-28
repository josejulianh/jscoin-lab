// JScoin - Semana 1: Fundamentos
// Prototipo educativo. NO apto para producción.

const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data))
      .digest('hex');
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), 'Genesis Block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

// Uso de ejemplo
const jscoin = new Blockchain();
jscoin.addBlock(new Block(1, Date.now(), { amount: 4 }));
jscoin.addBlock(new Block(2, Date.now(), { amount: 10 }));

console.log(JSON.stringify(jscoin, null, 2));
console.log('¿Cadena válida?', jscoin.isChainValid());

// Ejercicio extra: descomenta para probar invalidación
// jscoin.chain[1].data = { amount: 100 };
// console.log('¿Cadena válida después de alterar?', jscoin.isChainValid());
