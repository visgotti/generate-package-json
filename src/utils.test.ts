import * as assert from 'assert';
import { getNodeModuleDependencies, getVersions } from "./utils";
import 'mocha';
describe("getNodeModuleDependencies", () => {
      it("should return only @nestjs/common", () => {
        const fileToTest= `
          import { AuthController } from './auth/auth.controller';
          import { Module, Global } from '@nestjs/common';
          import { ProductController } from './db/product/product.controller';
          import { Module, Global } from '@nestjs/event-emitter';
          import * as bcrypt from 'bcrypt';
        `
      const result = getNodeModuleDependencies(fileToTest);
      assert.deepStrictEqual(result,  ['@nestjs/common', '@nestjs/event-emitter', 'bcrypt']);
   });
});

describe("getVersions", () => {
  it("should return version from lookup", () => {
   
const jsonContent = JSON.stringify({
  "dependencies": {
      "@nestjs/common": "^10.2.7",
    },
  })
  const result = getVersions(jsonContent, ['@nestjs/common']);
  assert.deepStrictEqual(result,  {'@nestjs/common': '^10.2.7'});
});
});