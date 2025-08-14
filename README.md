# PSSST - Share your Messages

**💭 Quick dev thoughts. Anytime, anywhere.**

Waiting for builds? Stuck on a bug? Just need a laugh? Get bite-sized developer stories from around the world - right in your terminal. No browser needed.

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
# "Code is like humor. When you have to explain it, it's bad"
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
# Public message (with your GitHub username)
pssst send "It works on my machine"

# Anonymous message
pssst send "우리 팀장이 git을 모른다" --anonymous
pssst send "오늘 면접에서 떨어졌다..." -a
```

**❗First time only:** [Setup GitHub CLI](#github-cli-setup-required-for-contributing) and run `gh auth login`

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
# Public contribution
$ pssst send "Finally fixed that bug that haunted me for 3 days"

Contributing your message...
Message contributed successfully!
https://github.com/yybmion/pssst/pull/42
@your_username • 📋 en

# Anonymous contribution  
$ pssst send "회사에서 야근이 너무 많다..." --anonymous

Contributing your message...
Anonymous mode
Message contributed successfully!
https://github.com/yybmion/pssst/pull/43
@anonymous • ko
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
| `--anonymous` | `-a` | Contribute message anonymously |
| `--help` | `-h` | Display help information |
| `--version` | `-V` | Display version number |

---

## Getting Started

1. **Install Node.js** (if not installed): Download from [nodejs.org](https://nodejs.org)
2. **Install PSSST**: `npm install -g pssst`
3. **Read messages**: `pssst`
4. **Share your thought**: `pssst send "Your experience"`
5. **Connect with global dev community**

---

## Requirements

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **GitHub CLI** (for contributing messages)

### **GitHub CLI Setup** (Required for contributing)

```bash
# Install GitHub CLI
winget install GitHub.cli        # Windows
brew install gh                  # macOS  
sudo apt install gh             # Ubuntu/Debian

# Authenticate
gh auth login
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
