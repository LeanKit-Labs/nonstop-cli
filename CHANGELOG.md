## 0.2.*

### 0.2.2
Use a non-zero exit code when upload fails

### 0.2.1
Add support for uploading over HTTPS via command line arguments and prompts

### 0.2.0
Update nonstop-pack version for better build number calculations. Since this is a departure, I've bumoed the version to treat it more like a breaking change

## 0.1.*

### 0.1.8
Update to support URL prefixes for index

### 0.1.7
Update to latest nonstop-pack to support new naming format that includes commit slugs

### 0.1.6
Update to latest nonstop-pack with support for drone environment variables

### 0.1.5
Exit with non-zero if any projects in the build fail

### 0.1.4
 * Enable upload to run without the need to prompt user
 * Support verbose build step output

### 0.1.3

 * Bug fix - Windows uses different environment variables to determine home directory
 * Print current build step to console

### 0.1.2

 * Exit and warn user when they choose not to create a nonstop file
 * Do not report uploads complete if no packages were selected for upload
 * Prompt user for packaging pattern during nonstop file creation

### 0.1.1

 * Improved error messages
 * Bug fixes around reporting individual project failures
 * Bug fix for building a single project
 * Support building all projects despite individual project failure
