
# Project Documentation

Welcome to the documentation for the project. This document provides an overview of the functionality and usage instructions for managing credentials in the system.

## Getting Started

To issue your first credential, you need to first register your public key in the `issuerDB` database. After this step, you can call the `issueCredential` function to issue a credential to the `identityHolder`.

A credential has the following structure:

```typescript
type Credential = Record<{
    did: string; // id
    issuer: string; // public key of the issuer
    identityHolder: string; // public key of the identity holder
    body: string; // JSON body of the credential
    title: string // title of the credential
    standard: string; // custom or link to the credential standard
    type: string; // KYC, balance check, and another
    dateIssued: nat64; // date issued
    validTime: nat64; // the validity time of the credential
}>
```

## Credential Management Functions

### Query Functions

- `checkCredentialDateValidity(did: string)`: Check the validity of a credential based on the `validTime` parameter and the current time.
    
- `getAllCredentialDatabase()`: Retrieve all current credentials stored in the database.
    
- `getCredential(did: string)`: Get a specific credential by providing its `did` (Decentralized Identifier).
    
- `getIssuersDB()`: Retrieve the entire database of registered issuers.
    

### Update Functions

- `registerIssuerAddress(address: string)`: Register the public address of an issuer.
    
- `issueCredential(credentialPayload: CredentialPayload)`: Issue a credential to an `identityHolder`. Make sure to register your public key before issuing a credential.
    
- `deleteCredential(did: string)`: Delete a credential specified by its `did`.
    


