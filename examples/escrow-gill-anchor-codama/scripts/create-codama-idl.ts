import { createFromRoot } from 'codama';
import { AnchorIdl, rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import anchorIdl from './idl/anchor_escrow_idl.json';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const codama = createFromRoot(rootNodeFromAnchor(anchorIdl as AnchorIdl));
const idlFolderPath = join(__dirname, 'idl');

if (!existsSync(idlFolderPath)) {
    mkdirSync(idlFolderPath, { recursive: true });
  }

const codamaFilePath = join(idlFolderPath, 'codama.json');
const json = codama.getJson();

writeFileSync(codamaFilePath, json);
console.log("->>>>>>>>>>>>>>>>>>>>> complete.")