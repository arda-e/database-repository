# Database Reliability Series

Building production-grade database layers from first principles

A comprehensive guide to building resilient, flexible, and maintainable database layers in TypeScript. Each post builds on the previous, taking you from basic abstractions to distributed systems.

## Prerequisites

- **Node.js**: v23 or higher (required for AsyncContext API)
- **Docker**: For running databases and other external dependencies locally (PostgreSQL, MongoDB, Kafka)
    - *Required only if you want to test with real databases instead of SQLite*
- Basic knowledge of TS, databases and sql. 

## Quick Start
Follow Along with the Series
Each post has a git tag. Check out the tag to see the code at that stage:
```bash
# Clone the repo
git clone https://github.com/arda-e/database-reliability.git
cd database-reliability

# See Post 1 code
git checkout v1-adapter
```

## 📚 The Series
### Post 1: Database Adapter Pattern
Swap databases without touching business logic. Build once, run anywhere.
**Tag** : v1-adapter 

#### What you'll learn:

Abstraction patterns for database independence
Connection resilience and retry logic
Testing with different databases
Environment-specific implementations

**Key concept**: Your code shouldn't know or care which database it's using.

### Post 2: Transactional Decorators Status: In Progress
Manage data consistency without polluting business logic.

**Tag**: v2-transactions

#### What you'll learn:

ACID transactions made simple
TypeScript decorators for automatic transaction management
Nested transactions and savepoints
Testing transactional behavior

**Key concept**: @Transactional() - atomicity without the ceremony.

## Contributing
Found a bug? Have a better approach? Want to add an example?

### Fork the repo
Create a feature branch (git checkout -b feature/amazing-improvement)
Commit your changes (git commit -m 'Add amazing improvement')
Push to the branch (git push origin feature/amazing-improvement)
Open a Pull Request

### License
MIT License - Use this code however you want. Learn from it, improve it, ship it.

### Star the Repo
If you find this series helpful, give it a star! 
It helps others discover it.
Questions? Open an issue or reach out on Twitter.
Let's build something reliable together.

## Resources

TBA

