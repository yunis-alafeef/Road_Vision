// Inspect the ONNX model signature (applied temporarily during setup).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ort = require('onnxruntime-node');
const path = require('node:path');

const modelPath = path.resolve('models/road_damage_yolov8_best.onnx');
const session = await ort.InferenceSession.create(modelPath);
console.log('INPUTS:');
for (const i of session.inputNames) {
  const meta = session.inputMetadata ? session.inputMetadata[i] : undefined;
  console.log('  ', i, JSON.stringify(meta));
}
console.log('OUTPUTS:');
for (const o of session.outputNames) {
  const meta = session.outputMetadata ? session.outputMetadata[o] : undefined;
  console.log('  ', o, JSON.stringify(meta));
}
