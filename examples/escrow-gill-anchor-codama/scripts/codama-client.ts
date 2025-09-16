import { renderVisitor } from '@codama/renderers-js';
import { createFromRoot, RootNode } from 'codama';
import codamaIDL from './idl/codama.json'
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const codama = createFromRoot(codamaIDL as unknown as RootNode);

const folderPath = join(process.cwd(), 'src', 'generated', './');

if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
  }

  codama.accept(renderVisitor(folderPath, {formatCode: true}));

  console.log("->>>>>>>>>>>>>>>>>>>>> code generation complete.")
