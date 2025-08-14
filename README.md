# PSSST - Share your Messages

**💭 Quick dev thoughts. Anytime, anywhere.**

Waiting for builds? Stuck on a bug? Just need a laugh? Get bite-sized developer stories from around the world - right in your terminal. No browser needed.

"Don't just read - share your contents too!"

---

## Quick Start

### Installation

```bash
npm install -g pssst
```

### Basic Usage

```bash
# Get a random developer message
pssst

# Example output:
# "Fuck, I've been debugging this for 3 hours"
# - 2hours before, @yybmion
```

That's it! Start exploring global developer thoughts right away! 🎉

---

## 📖 Usage Guide

### 🔍 **View Messages**

```bash
# Random message from all languages
pssst

# English messages only  
pssst --lang en

# Korean messages only
pssst --lang ko

# Show detailed author information
pssst --detailed

# View recent messages
pssst recent

# View recent 5 messages in Korean
pssst recent 5 --lang ko
```

### 🌐 **Language Options**

| Language | Code |
|----------|------|
| English | `en` |
| Korean | `ko` |
| Chinese | `ch` |
| Japanese | `jp` |
| All | `all` |

### ✍️ **Contribute Messages**

Share your developer experience with the global community:

```bash
# Anonymous message (no GitHub CLI required)
pssst send "Send message anonymously" --anonymous
pssst send "Works without GitHub CLI" -a

# Public message (GitHub CLI authentication required)
pssst send "It works on my machine"
```

**Two modes available:**
- **Anonymous Mode**: No GitHub CLI needed - start contributing immediately!
- **Public Mode**: Requires [GitHub CLI setup](#github-cli-setup-optional-for-public-messages) - shows your GitHub username

**What happens next:**
1. **Auto-creates PR** to our repository
2. **AI detects language** and checks content appropriateness
3. **Auto-merges** if content is appropriate
4. **Your message becomes available** to developers worldwide

---

## 💡 Examples

### 💻 Daily Developer Life

```bash
$ pssst --lang en  
"When I wrote this code, only God and I understood what I did. Now only God knows"
- 1day before, @yybmion

$ pssst --lang ko
"Stack Overflow가 없다면 내 코드의 90%는 존재하지 않을 것"
- 2hours before, @yybmion
```

### 📋 Recent Messages

```bash
$ pssst recent 3

📝 Recent 3 messages from all:

1. "Programming is like sex: One mistake and you have to support it for the rest of your life"
   - 1days before, @yybmion

2. "카페인을 코드로 변환하는 유기체입니다"
   - 2days before, @yybmion

3. "Code is like humor. When you have to explain it, it's bad"
   - 3days before, @yybmion
```

### 🔍 Detailed Information

```bash
$ pssst --detailed
"There are only 10 types of people in this world: those who understand binary and those who don't"
- 1hour before, @yybmion
- Profile: https://github.com/yybmion
```

### 📝 Contributing Your Thoughts

```bash
# 🕶️ Anonymous contribution (no setup required)
$ pssst send "회사에서 야근이 너무 많다..." --anonymous

Contributing your message...
Anonymous mode - no authentication required
Message contributed successfully!
https://github.com/yybmion/pssst/pull/43
@anonymous

# 👤 Public contribution (GitHub CLI required)
$ pssst send "Finally fixed that bug that haunted me for 3 days"

Contributing your message...
Public mode - GitHub CLI authentication required
Checking GitHub CLI authentication...
Authenticated as: yybmion
Message contributed successfully!
https://github.com/yybmion/pssst/pull/42
@yybmion
```

---

## 🛠️ Advanced Usage

### **Command Options**

```bash
pssst [options]                    # View random message
pssst recent [count] [options]     # View recent messages (default: 10)
pssst send <message> [options]     # Contribute new message
pssst --help                       # Show help information
pssst --version                    # Show version
```

### **Available Flags**

| Flag | Short | Description |
|------|-------|-------------|
| `--lang <code>` | `-l` | Filter by language (ko/en/ch/jp/all) |
| `--detailed` | `-d` | Show detailed author information |
| `--anonymous` | `-a` | Contribute message anonymously (no GitHub CLI required) |
| `--help` | `-h` | Display help information |
| `--version` | `-V` | Display version number |

---

## Getting Started

### 🚀 **Instant Start (No Setup)**
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org)
2. **Install PSSST**: `npm install -g pssst`
3. **Read messages**: `pssst`
4. **Share anonymously**: `pssst send "Your experience" --anonymous`

### 👤 **Public Contributions (Optional)**
5. **Setup GitHub CLI**: [Follow setup guide](#github-cli-setup-optional-for-public-messages)
6. **Share with your name**: `pssst send "Your experience"`

---

## Requirements

### **Essential (for reading & anonymous contributions)**
- **Node.js** >= 16.0.0
- **npm** >= 7.0.0

### **Optional (for public contributions)**
- **GitHub CLI** (only needed if you want to contribute with your GitHub username)

### **GitHub CLI Setup** (Optional for public messages)

**Only install if you want to contribute with your GitHub username:**

```bash
# Install GitHub CLI
winget install GitHub.cli        # Windows
brew install gh                  # macOS  
sudo apt install gh             # Ubuntu/Debian

# Authenticate (one-time setup)
gh auth login
```

**Don't want to install GitHub CLI?** No problem! Use anonymous mode:
```bash
pssst send "Your message" --anonymous
```

### 💡 **If you don't have npm installed**

**Windows:**
```bash
# Download from official website or use package manager
winget install OpenJS.NodeJS
# or visit https://nodejs.org
```

**macOS:**
```bash
# Using Homebrew
brew install node
# or visit https://nodejs.org
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm
```

---

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

___

<div align="center">

**Made with ❤️ by developers, for developers worldwide**

*Connect • Share • Inspire*

</div>
