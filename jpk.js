import * as std from "std";

const debug = text => {
  console.log(`[DEBUG] ${text}`);
}

const run = command => {
  const fd = std.popen(command, "r");
  let msg = "",
  r = "";

  while(( r = fd.getline() ) != null) {
    msg += r + "\n";
  }
  return msg;
}

const checksum = (path, hash) => {
    let chs;
  try {
    chs = run(`${hash} ${path}`).split("\n")[0].split(" ")[0];
  } catch(err) {
    chs = `unable to run ${hash} on ${path}
${err}
`;
  }
  return chs;
}


const getArguments = () => {
  scriptArgs.shift(); // remove script name
  return scriptArgs;
}

const getAvailablePackages = () => {
  const urls = JSON.parse(std.loadFile("repos.json")).urls;
  let packages = [];
  for (let i in urls) {
    const url = JSON.parse(std.urlGet(`${urls[i]} --silent`)).urls;
    const fullPackages = JSON.parse(std.urlGet(`${url} --silent`));
    const availablePackages = Object.keys(fullPackages);
    for (let j in availablePackages) {
      packages.push({
        name: availablePackages[j],
	description: fullPackages[availablePackages[j]].description,
	version: fullPackages[availablePackages[j]].version,
        from: fullPackages[availablePackages[j]].source,
	url: fullPackages[availablePackages[j]].url, 
	destFolder: fullPackages[availablePackages[j]].install,
        sha256sum: fullPackages[availablePackages[j]].sha256sum,
	md5sum: fullPackages[availablePackages[j]].md5sum,
	sha1sum: fullPackages[availablePackages[j]].sha1sum,
	engines: fullPackages[availablePackages[j]].engines,
	autoupdate: fullPackages[availablePackages[j]].autoupdate
      });
    }
  }
  debug(`available packages for install:
${JSON.stringify(packages, null, 2)}
`);
  return packages;
}

// May catch some user mistakes
const isValidUrl = url => {
  let validUrl = false;
  if (/^https?\:\/\/[-a-z0-9@\._]{1,256}\.[a-z]{2,}/i.test(url)) { // clasic url
    validUrl = true;
    debug(`${url} pass the clasic url test`);
  } else if (/^https?\:\/\/[a-z]{1,256}/.test(url)) { // localhost url
    validUrl = true;
    debug(`${url} pass the hostname/localhost url test`);
  } else if (/^(https?\:\/\/)?[0-9]{1,}\.[0-9]{1,}\.[0-9]{1,}\.[0-9]{1,}/.test(url))  { // ipv4 url
    validUrl = true;
    debug(`${url} pass the ipv4 url test`);
  }

  debug("After test if " + url + " is a valid url, the result is " + validUrl);
  return validUrl;
}

const isValidUrlsFile = filename => {
  let urls;
  try {
    debug("Trying to load " + filename + " in memory as a list of urls");
    urls = std.loadFile(filename).split("\n");
  } catch(err) {
    debug(err);
    return false;
  }
  debug("Popping extra element from urls array");
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
  debug(`Returning ${urls}`);
  return urls;
}

const urlPointsToValidJSON = url => {
  debug(`Testing if ${url} points to a valid JSON file`);
  let json;
  try {
    json = std.urlGet(url + " --silent");
  } catch(err) {
    debug(`Error downloading json from the url using curl command:
${err}
`);
    return false;
  }

  let obj;
  try {
    obj = JSON.parse(json);
  } catch(err) {
    debug(`Error parsing response as a json file:
${err}
`);
    return false;
  }

  if (obj?.urls?.length) {
    for (let i in obj.urls) {
      if (!isValidUrl(obj.urls[i])) {
	debug(`The extracted url ${obj.urls[i]} is not valid`);
        return false;
      }
    }
    debug(`All urls are valid`);
    return true;
  } else {
    debug(`The parsed json is missing "urls" array property`);
    return false;
  }
}

const addUrlsToJSON = urls => {
console.log("Trying to add urls to json");
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

  debug(JSON.stringify(json, null, 2));
  for (let i in urls) {
    json.urls.push(urls[i]);
  }

  json.urls = [...new Set(json.urls)]; // remove duplicates

  const fd = std.open("repos.json", "w");
  fd.puts(JSON.stringify(json, null, 2));
  fd.close();
}

const add = args => {
  debug("add function called");
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
    debug("Not enought arguments to keep running.");
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
  debug(`Adding ${args} to JSON`);
  addUrlsToJSON(args);
  console.log("Done.");
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
  debug("install function called");
  if (!args.length) {
    console.log(`USAGE:
jpk install <package-name|package-name/from>

DESCRIPTION:
Install a package.
`);
    return;
  }

  const availablePackages = getAvailablePackages();
  for (let i in args) {
    for (let j in availablePackages) {
      debug(`Testing requested package "${args[i]}" against found package "${availablePackages[j].name}"`);
      if (args[i] == availablePackages[j].name) {
        debug(`The package ${args[i]} was found in ${availablePackages[j].from}`);
	debug(`Testing if jpk folder exists`); 
	let jpkFolderExists = false;
        let aux = run('[ -d "$PREFIX/include/jpk" ] && echo "true"');
	if (!aux) {
          debug("$PREFIX/include/jpk folder not found, creating...");
	  run('mkdir "$PREFIX/include/jpk"');
	  aux = run('[ -d "$PREFIX/include/jpk" ] && echo "true"');
	  if (!aux) {
            console.log(`ERROR: Unable to create $PREFIX/include/jpk folder. Please do it manually and try again`);
	    return;
	  }
	}

	debug(`Testing if jpk/installed folder exists`);
        aux = run('[ -d "$PREFIX/include/jpk/installed" ] && echo "true"');
        if (!aux) {
          debug("$PREFIX/include/jpk/installed folder not found, creating...");
	  run('mkdir "$PREFIX/include/jpk/installed"');
	  aux = run('[ -d "$PREFIX/include/jpk/installed" ] && echo "true"');
	  if (!aux) {
            console.log(`ERROR: Unable to create $PREFIX/include/jpk/installed folder. Please do it manually and try again`);
	    return;
	  }
	}


        debug(`Testing if jpk/installed/${availablePackages[j].destFolder} folder exists`);
        aux = run(`[ -d "$PREFIX/include/jpk/installed/${availablePackages[j].destFolder}" ] && echo "true"`);
        if (!aux) {
	  debug(`$PREFIX/include/jpk/installed/${availablePackages[j].destFolder} folder not found, creating...`);
	  run(`mkdir "$PREFIX/include/jpk/installed/${availablePackages[j].destFolder}"`);
          aux = run(`[ -d "$PREFIX/include/jpk/installed/${availablePackages[j].destFolder}" ] && echo "true"`);
	  if (!aux) {
            console.log(`ERROR: Unable to create $PREFIX/include/jpk/installed/${availablePackages[j].destFolder} folder. Please do it manually and try again`);
	    return;
	  }
	}

        debug(`Installing package...`);
	let filename = availablePackages[j].url.split("/");
	filename = filename[filename.length-1];
        run(`curl ${availablePackages[j].url} --silent -o "$PREFIX/include/jpk/installed/${availablePackages[j].destFolder}/${filename}" `);

        aux = run(`[ -f "$PREFIX/include/jpk/installed/${availablePackages[j].destFolder}/${filename}" ] && echo "true"`);
	if (!aux) {
          console.log(`Error finding $PREFIX/include/jpk/installed/${availablePackages[j].destFolder}/${filename}". Try again.`);
	  return;
	}

	const prefix = run(`echo "$PREFIX"`).split("\n")[0];
        const chs = checksum(`${prefix}/include/jpk/installed/${availablePackages[j].destFolder}/${filename}`, "sha256sum");
	if (chs != availablePackages[j].sha256sum) {
          console.log(`ERROR, HASHES NOT MATCHING.
Expected hash:
${availablePackages[j].sha256sum}

Real hash:
${chs}

What this means?
The downloaded file is not what the author of the package said. Why?
- The repository you're using is not updated to the match the real package.
- The download did not complete, try to install the package again.
- The file is modified without notice, can be malware.
- A MITM attack replace file content.
- The location of the resource changed.

What can i do if i'm not sure?
- Try to contact the repository owner.
- Try to install the package from other repository.

Package installation is not recommended.
`);
	  debug("Removing package because hashes are not matching.");
	  run(`rm ${prefix}/include/jpk/installed/${availablePackages[j].destFolder}/${filename}`);
	  return;

	} else {
	  console.log(`Hashes match.`);
	}

	console.log(`Package ${args[i]} installed.`);

	debug(`Adding package to list of installed packages...`);
	aux = run(`[ -f "$PREFIX/include/jpk/installed/installed-packages.json" ] && echo "true"`);
        if (!aux) {
          debug(`Creating installed-packages.json file...`);
          run(`touch "$PREFIX/include/jpk/installed/installed-packages.json"`);
	}

	let installedPackagesJson;
	try {
	  installedPackagesJson = JSON.parse(std.loadFile(`${prefix}/include/jpk/installed/installed-packages.json`));
	} catch(err) {
          debug(`ERROR: Unable to parse file as JSON
${err}

`);
	}

	debug(`Opening ${prefix}/include/jpk/installed/installed-packages.json file`);
        const fd = std.open(`${prefix}/include/jpk/installed/installed-packages.json`, "w");
    
	if (!installedPackagesJson) {
	  debug(`Unable to load file installed-packages.json`);
	  const ipj = {
	    packages: []
	  };
	  ipj.packages.push(availablePackages[j]);
          fd.puts(JSON.stringify(ipj, null, 2));
	  debug(`Package pushed to new installed-packages.json`);
	} else {
	  debug(`Found installed-packages.json, testing if file have a packages property`);
          if (installedPackagesJson?.packages.length >= 0) {
	    debug(`package property found`);
            installedPackagesJson.packages.push(availablePackages[j]);
	    fd.puts(JSON.stringify(installedPackagesJson, null, 2));
            debug(`Pushed new package to packages array`);
	  } else {
	    debug(`package property not found, creating a new file`);
            const ipj = {
              packages: []
	    };
	    ipj.packages.push(availablePackages[j]);
	    fd.puts(JSON.stringify(ipj, null, 2));
	    debug(`New installed-packages.json file created to replace corrupted version`);
	  }
	}

	debug(`Closing installed-packages.json file`);
	fd.close();
        debug(`Package added to $PREFIX/include/jpk/installed/installed-packages.json`);
	console.log("Done.");
      }
    }
  }

}

const list = args => {
  debug("list function called");
  if (!args.length) {
    console.log(`USAGE:
jpk list <available|installed>

DESCRIPTION:
List all available or installed packages.
`);
    return;
  }

  if (args.length > 1) {
    console.log("To many arguments");
    return false;
  }

  if (args[0] === "installed") {
    const prefix = run(`echo "$PREFIX"`).split("\n")[0];
      let installedPackagesJson;
    try {
      installedPackagesJson = JSON.parse(std.loadFile(`${prefix}/include/jpk/installed/installed-packages.json`));
    } catch(err) {
      debug(`No installed packages found
${err}
`);
      return;
    }

    console.log("Packages:");
    for (let i in installedPackagesJson.packages) {
      console.log(`${installedPackagesJson.packages[i].name}
  from ${installedPackagesJson.packages[i].from}
  version - ${installedPackagesJson.packages[i].version}
  description - ${installedPackagesJson.packages[i].description}\n`);
    }
    return;

  } else if (args[0] === "available") {
    const urls = JSON.parse(std.loadFile("repos.json")).urls;
    for (let i in urls) {
      const url = JSON.parse(std.urlGet(`${urls[i]} --silent`)).urls;
      const fullPackages = JSON.parse(std.urlGet(`${url} --silent`));
      const availablePackages = Object.keys(fullPackages);

      debug(`Url (${urls[i]}) contains ${url}`);
      debug(`Full packages: ${JSON.stringify(fullPackages, null, 2)}`);
      debug(`Available Packages: ${availablePackages}`);
      console.log("Packages:");
      for (let j in availablePackages) {
        console.log(`${availablePackages[j]}
  from ${fullPackages[availablePackages[j]].source}
  version - ${fullPackages[availablePackages[j]].version}
  description - ${fullPackages[availablePackages[j]].description}\n`);
      }
    }
  } else {
    console.log(`${args[0]} is not an available option. Chose available or installed`);
  }

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

