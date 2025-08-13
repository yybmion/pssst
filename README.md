# PSSST - Share your Messages

> *"Code has no borders. Share your story."*

A CLI tool for sharing and discovering developer thoughts from around the world. Connect with fellow developers globally through their daily (coding) experiences, frustrations, and insights.

---

## 🚀 Quick Start

### Installation

```bash
npm install -g pssst
```

### Basic Usage

```bash
# Get a random developer message
pssst

# Example output:
# "I've been developing while listening to Sik-K's 'lov3' music these days. You should give it a listen, I recommend it."
# - 3hours before, @yybmion
```

That's it! Start exploring global developer thoughts right away! 🎉

---

## 📖 Usage Guide

### 🔍 **View Messages**

```bash
# Random message from all languages
pssst

# Korean messages only
pssst --lang ko

# English messages only  
pssst --lang en

# Show detailed author information
pssst --detailed
```

### 🌐 **Language Options**

| Language | Code |
|----------|------|
| Korean | `ko` |
| English | `en` |
| Chinese | `ch` |
| Japanese | `jp` |
| All | `all` |

### ✍️ **Contribute Messages**

Share your developer experience with the global community:

```bash
pssst send ""It doesn't matter if it's everyday content, development experiences, or funny stories. Just share your stories!""
```

**What happens next:**
1. 🔄 **Auto-creates PR** to our repository
2. 🤖 **AI detects language** and checks content appropriateness  
3. 🏷️ **Adds language label** and prefix automatically
4. ✅ **Auto-merges** if content is appropriate
5. 🌍 **Your message becomes available** to developers worldwide

---

## 💡 Examples

### 💻 Daily Developer Life

```bash
$ pssst --lang en  
"Monday morning debugging feels like Sisyphus rolling the boulder"
- 1day before, @dev_sarah

$ pssst --lang ko
"오늘도 디버깅으로 시작하는 하루"
- 2hours before, @coder_kim
```

### 🔍 Detailed Information

```bash
$ pssst --detailed
"HTML is a programming language"
- 1hour before, @yybmion
- Profile: https://github.com/yybmion
```

### 📝 Contributing Your Thoughts

```bash
$ pssst contribute "Finally fixed that bug that haunted me for 3 days"

Contributing your message...
Message: "Finally fixed that bug that haunted me for 3 days"
Detecting language...
   Detected: en (US)
Cloning repository...
Creating branch: add-message-1705123456789
Adding message to en.json and all.json...
Committing changes...
Pushing to GitHub...
Creating Pull Request...

Message contributed successfully!
PR created: https://github.com/yybmion/pssst/pull/42
Author: @your_username
Language detected: en
Your message will be reviewed and merged automatically
```

---

## 🛠️ Advanced Usage

### 🎯 **Command Options**

```bash
pssst [options]                    # View random message
pssst send <message>         # Contribute new message
pssst --help                       # Show help information
pssst --version                    # Show version
```

### ⚙️ **Available Flags**

| Flag | Short | Description |
|------|-------|-------------|
| `--lang <code>` | `-l` | Filter by language (ko/en/ch/jp/all) |
| `--detailed` | `-d` | Show detailed author information |
| `--help` | `-h` | Display help information |
| `--version` | `-V` | Display version number |

---

## 🚦 Getting Started

1. **Install PSSST**: `npm install -g pssst`
2. **Read messages**: `pssst`
3. **Share your thought**: `pssst send "Your experience"`
4. **Connect with global dev community** 🌍

---

## 📋 Requirements

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0  
- **GitHub CLI** (for contributing messages)

### 🔧 **GitHub CLI Setup** (Required for contributing)

```bash
# Install GitHub CLI
winget install GitHub.cli        # Windows
brew install gh                  # macOS  
sudo apt install gh             # Ubuntu/Debian

# Authenticate
gh auth login
```

---

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

___

<div align="center">

**Made with ❤️ by developers, for developers worldwide**

*Connect • Share • Inspire* 

[⬆ Back to Top](#-pssst---global-developer-messages)

</div>
