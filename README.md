## nonstop cli
This project provides a command line interface for building, packaging and uploading your project(s) locally from the shell. This allows you to make changes to the build file and know exactly how the build will run on a build agent after you've pushed your code. It also allows you to explore any number of interesting use cases outside of the usual CI server/build agent interaction pattern.

## Things to keep in mind
Version is always determined by a file. For node projects, package.json should provide the version. *.app.src is how you should specify version in Erlang. The convention for .Net/Mono projects is to put a version attribute for the assembly in AssemblyInfo.cs. In the event nonstop cannot determine where to get the version, it will ask you which file it should read the version from.

Build count is determined by the number of commits that exist for a version. If you want to produce a package with a new build number, you'll need to create a commit __first__. nonstop will not overwrite an existing package unless you use a force flag ( -f or --force) to prevent accidentally changing the contents of a package based on code that belongs in a new commit.

## Use cases
This CLI exists to support four primary use cases:

### Build and pack
By default, nonstop will build and package the result (in the event of a successful build). Packages will be created in './packages' (add this path to your .gitignore and .npmignore).

As mentioned above, if a package has already been created for the last commit in your repository, nonstop will not replace the package without a force flag.


__Builds all projects__
```bash
ns
```

__Build a specific project__
```bash
ns --project [projectName]
```

### Build only
If you only want to see the result of the build and not create a package, you can use this command to test the status of your build.

__Builds all projects without creating packages__
```bash
ns nopack
```

__Build a specific project without creating a package__
```bash
ns nopack --project [projectName]
```

### Build file creation
If you don't have a build file and run nonstop, you'll be asked if you'd like help creating a build file. This interactive console mode will walk you through a series of steps and attempt to help you create a build file.

### Uploading
This command can upload one or more packages generated from a build.

__Upload one or more packages selected from a list__
```bash
ns upload
```

__Upload a specific package__
```bash
ns upload ./packages/[specificPackageFile].tar.gz
```

__Upload latest package without prompts__
```bash
ns upload --latest --index [index address] --port [index port] --token [auth token]
```

__Upload latest package over HTTPS, without prompts and custom api url__
```bash
ns upload --latest --secure --index [index address] --url /prefixed/api --port [index port] --token [auth token]
```

## Dependencies

This project depends on several core nonstop modules:

 * [nonstop-pack](https://github.com/LeanKit-Labs/nonstop-pack)
 * [nonstop-build](https://github.com/LeanKit-Labs/nonstop-build)
 * [nonstop-index-client](https://github.com/LeanKit-Labs/nonstop-index-client)

It also was made possible by several great Node modules:

 * machina
 * when
 * commander
 * inquirer
 * lodash
