import * as std from "std";

const getArguments = () => {
  scriptArgs.shift(); // remove script name
  return scriptArgs;
}

// May catch some user mistakes
const isValidUrl = url => {
  let validUrl = false;
  if (/^https?\:\/\/[-a-z0-9@\._]{1,256}\.[a-z]{2,}/i.test(url)) { // clasic url
    validUrl = true;
  } else if (/^https?\:\/\/[a-z]{1,256}/.test(url)) { // localhost url
    validUrl = true;
  } else if (/^(https?\:\/\/)?[0-9]{1,}\.[0-9]{1,}\.[0-9]{1,}\.[0-9]{1,}/.test(url))  { // ipv4 url
    validUrl = true;
  }
  return validUrl;
}

const add = args => {
  if (!args.length) {
    console.log(`USAGE:
jpk add <https://github.com/user/my-jpk-packages/hacking-packages.json>

DESCRIPTION:
Add your own json list ready to list and install packages from.

EXAMPLE OF VALID JSON FILE:
{
    "js": {
      "description": "Run javascript from your shell",
      "version": "0.0.1",
      "url": "https://github.com/stringmanolo/jpk/default/js/js",
      "md5sum": "a2bcbed1a1e596ce5db0b0f231c98e6c",
      "sha1sum": "8ef8ed43154a50ec7aa0e98dcac2b993b3fd69b0",
      "sha256sum": "57e87c3193868f278c705d338125e9473c30f555f10ca1b00e50fd6af92b0b28",
      "install": "bin",
      "engines": [ "quickjs", "node" ],
      "autoupdate": "false"
    },
    "test": {
      "description": "Test jpk is working",
      "version": "0.0.1",
      "url": "https://github.com/stringmanolo/jpk/default/test/test.js",
      "md5sum": "32950a7ca52c2892a73460dce55590d1",
      "sha1sum": "acc838c947ed7079be59958b28239089f5172bb2",
      "sha256sum": "fd53f512b7a5369150f9a72e6620b832d587ba144c59c5a67b52a135da0770f8",
      "install": "scripts",
      "engines": [ "node", "quickjs" ],
      "autoupdate": "true"
    }
}
`)
    return;
  }
 
  for (let i in args) {
    if(isValidUrl(args[i]) === false) {
      console.log(`${args[i]} is not a valid url`);
      return;
    }
  }
  
  for (let i in args) {
    std.loadUrl(`${args[i]} --silent`);
  }
  // check if all urls are valid json
  // test if valid json
  // add urls to repos.json
}

const backup = args => {
  console.log(`backup ${args}`);
}

const check = args => {
  console.log(`checksum ${args}`);
}

const help = args => {
  console.log(`help ${args}`);
}

const install = args => { 
  console.log(`Installing ${args}`);
}

const list = args => {
  console.log(`List ${args}`);
}

const remove = args => {
  console.log(`Remove ${args}`);
}

const uninstall = args => {
  console.log(`Uninstalling ${args}`);
}

const version = args => {
  console.log(`Version ${args}`);
}

const usage = () => {
  console.log(`Usage: `);
}

const parseArguments = args => {
  switch(args[0]) {
    case "a":
    case "add":
      args.shift();
      add(args);
    return;

    case "b":
    case "backup":
      args.shift();
      backup(args);
    return;

    case "c":
    case "check":
    case "checksum":
      args.shift();
      check(args);
    return;

    case "h":
    case "help":
      args.shift();
      help(args);
    return;

    case "i":
    case "install":
      args.shift();
      install(args);
    return;

    case "l":
    case "list":
      args.shift();
      list(args);
    return;

    case "r":
    case "remove":
      args.shift();
      remove(args);
    return;

    case "u":
    case "uninstall":
      args.shift();
      uninstall(args);
    return;

    case "v":
    case "ver":
    case "version":
      args.shift();
      version(args);
    return;

    default:
      // test if args is a valid installed package or script name
      usage(); 
    return;
  }
}


const args = getArguments();
parseArguments(args);

