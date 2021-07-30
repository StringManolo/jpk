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

const isValidUrlsFile = filename => {
  let urls;
  try {
    urls = std.loadFile(filename).split("\n");
  } catch(err) {
    return false;
  }
  urls.pop();

  if (!urls.length) {
    console.log(`Not urls found in ${filename} file`);
    return false;
  }
  for (let i in urls) {
    if(!isValidUrl(urls[i])) {
      console.log(`The url ${urls[i].substr(0, 200)}... extracted from ${filename} is not a valid url`);
      return false;
    }
  }
  return urls;
}

const urlPointsToValidJSON = url => {
  const json = std.urlGet(url + " --silent");
  const obj = JSON.parse(json);
  if (obj?.urls?.length) {
    for (let i in obj.urls) {
      if (!isValidUrl(obj.urls[i])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

const addUrlsToJSON = urls => {
  let json;
  let fileExists = true;
  try {
    json = std.loadFile("repos.json");
    if (json === null) {
      throw new Error("File not found");
    }
  } catch(err) {
    json = { urls: [] };
    console.log("json asigned after file load error");
    fileExists = false;
  }

  if (fileExists) {
    try {
      json = JSON.parse(json);
    } catch(err) {
      fd = std.open(".corrupted_repo.json", "a+");
      fd.puts(std.loadFile("repos.json"));
      fd.close();
      json = { urls: [] };
      console.log("json asigned after parser error");
    }
  }


console.log(JSON.stringify(json, null, 2));
  for (let i in urls) {
    json.urls.push(urls[i]);
  }

  json.urls = [...new Set(json.urls)]; // remove duplicates

  const fd = std.open("repos.json", "w");
  fd.puts(JSON.stringify(json, null, 2));
  fd.close();
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
      "url": "https://raw.githubusercontent.com/StringManolo/jpk/master/repos/default/js/js",
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
      "url": "https://raw.githubusercontent.com/StringManolo/jpk/master/repos/default/test/test",
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
 
  for (let i = 0; i < args.length; ++i) {
    if(isValidUrl(args[i]) === false) {
      // test if filename
      const urls = isValidUrlsFile(args[i]);
      if (urls) { // if urls in file
	args.splice(i, 1); // remove filename from urls array
	for (let j in urls) {
          args.push(urls[j]); // add urls to end of current loop
        }
      } else {
        console.log(`${args[i]} is not a valid url or filename`);
        return;
      }
    }
  }
  
  // check if all urls are valid json:
  for (let i in args) {
    if (!urlPointsToValidJSON(args[i])) {
      return;
    }
  }
  
  // add urls to repos.json
  console.log(`Adding ${args} to JSON`);
  addUrlsToJSON(args);
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

