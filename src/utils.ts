import type { NxProjectJson, PackageJson } from "./types"
import * as fs from 'fs';
import * as path from 'path';

export function getNodeModuleDependencies (fileContent: string, ignoreStartsWith=['.', '~/', '@/']) : Array<string> {
  const regex = /import\s*(?:{[^}]*}|\*\s*as\s*\w*)\s*from\s*['"]([^'"]+)['"]/g;
  const matches = fileContent.match(regex);
  const moduleNames = matches?.map(match => {
    const moduleNameMatch = /from\s*['"]([^'"]+)['"]/;
    const moduleName = match.match(moduleNameMatch);
    return moduleName ? moduleName[1] : null;
  }).filter(m => {
    return !!m && !ignoreStartsWith.some((s) => m.startsWith(s));
  }) || [];
  return moduleNames;
};

export function getVersions (jsonFile: string | PackageJson, dependencies: Array<string> | Set<string>) : {[key: string]: string }  {
  const jsonObj : PackageJson = typeof jsonFile === 'string' 
  ? JSON.parse(jsonFile)
   : jsonFile;
   const final :  {[key: string]: string } = {};
   const jsonDependencies = jsonObj?.dependencies || {}
   dependencies.forEach(d => {
  	if(d in jsonDependencies) {
    	final[d] = jsonDependencies[d]
    }
  });
  return final;
} 

export function generateJson(name: string, dependencies: {[key: string]: string }) : PackageJson {
  return {
    name,
    version: "0.0.0",
    dependencies
  }
}

function getPackageJson(rootPath: string) : PackageJson | null {
  const wouldBePath = path.join(rootPath, 'package.json');
  if(fs.existsSync(wouldBePath)) {
    return JSON.parse(fs.readFileSync(wouldBePath, 'utf-8')) as PackageJson
  };
  return null;
}

function getNxProjectJson(rootPath: string) : NxProjectJson | null {
  const wouldBePath = path.join(rootPath, 'project.json');
  if(fs.existsSync(wouldBePath)) {
    return JSON.parse(fs.readFileSync(wouldBePath, 'utf-8')) as PackageJson
  };
  return null;
}


function readFilesRecursively(directory: string, fileEndings: string[], onFound: (fileContent: string) => void) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      readFilesRecursively(filePath, fileEndings, onFound);
    } else if (fileEndings.some(e => file.endsWith(e))) {
      const content = fs.readFileSync(filePath, 'utf-8');
      onFound(content);
    }
  });
}


export async function ensureDirectoryExists(directoryPath: string) {
  if(!fs.existsSync(directoryPath)) {
    await fs.mkdirSync(directoryPath, { recursive: true })
  }
}


export function generateNx(pathToProject: string, pathToRoot: string, saveToPath?: string) : PackageJson {
  const nxJsonData = getNxProjectJson(pathToProject);
  const packageJsonData = getPackageJson(pathToProject);

  if(!packageJsonData && !nxJsonData) throw new Error(`No package or project json found`);

  const rootPackageJsonData = getPackageJson(pathToRoot);
  const allDeps = new Set<string>();
  readFilesRecursively(pathToProject, ['.ts', '.js'], (foundFile: string) => {
    const deps = getNodeModuleDependencies(foundFile);
    deps.forEach(d => {
      allDeps.add(d);
    })
  });
  const localDeps = packageJsonData ? getVersions(packageJsonData, allDeps) : {};
  const rootDeps = getVersions(rootPackageJsonData, allDeps);



  const name = packageJsonData?.name || nxJsonData.name;
  const obj = generateJson(name, { 
    ...rootDeps,
    ...localDeps,
  });
  if(saveToPath) {
    ensureDirectoryExists(saveToPath);
    fs.writeFileSync(path.join(saveToPath, 'package.json'), JSON.stringify(obj, null, 2), 'utf-8');
    console.log('Wrote generated package.json to', saveToPath);
  }
  return obj;
}