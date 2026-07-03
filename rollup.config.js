
import resolve from '@rollup/plugin-node-resolve';


export default [{
  input: './src/runtime/index.js',
  output: {
    file: './runtime.js',
    format: 'es'
  },
  onwarn(w, warn) {
    if(w.code == 'ILLEGAL_REASSIGNMENT' && w.message.includes('import "share"')) return;
    warn(w);
  }
}, {
  input: './src/compiler.js',
  output: {
    file: './apis.mjs',
    format: 'es'
  },
  plugins: [resolve()]
}, {
  input: './src/compiler.js',
  output: {
    file: './apis.js',
    name: 'apis',
    format: 'umd'
  },
  plugins: [resolve()]
}];
