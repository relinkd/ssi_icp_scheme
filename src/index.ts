import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Credential = Record<{
    did: string; // id
    issuer: string; // public key of issuer
    identityHolder: string; // public key of identity holder
    body: string; // json body of credential
    title: string // title of credential
    standard: string; // custom or link to credential standard
    type: string; // KYC balance check and another
    dateIssued: nat64; // date issued
    validTime: nat64; // the valid time of credential
}>

type CredentialPayload = Record<{
    issuer: string;
    validTime: nat64;
    type: string;
    body: string;
    standard: string;
    title: string;
    identityHolder: string;
}>


const issuerDB = new StableBTreeMap<string, boolean>(0, 50, 100);
const credentialStorage = new StableBTreeMap<string, Credential>(2, 50, 5000);


$query;
export function checkCredentialDateValidity(did: string): Result<boolean, string> {
    return match(credentialStorage.get(did), {
        Some: (credential) => {
            if((credential.dateIssued + credential.validTime) < ic.time()) return Result.Ok<boolean, string>(false);

            return Result.Ok<boolean, string>(true)
        },
        None: () => Result.Err<boolean, string>(`a credential with did=${did} not found`)
    });
}

$query;
export function getAllCredentialDatabase(): Result<Vec<Credential>, string> {
    return Result.Ok(credentialStorage.values());
}

$query;
export function getCredential(did: string): Result<Credential, string> {
    return match(credentialStorage.get(did), {
        Some: (credential) => Result.Ok<Credential, string>(credential),
        None: () => Result.Err<Credential, string>(`a credential with did=${did} not found`)
    });
}

$query;
export function getCurrentTime(): Result<nat64, string> {
    return Result.Ok(ic.time());
}

$query;
export function getIssuersDB(): Result<Vec<string>, string> {
    return Result.Ok(issuerDB.keys());
}


$update;
export function issueCredential(credentialPayload: CredentialPayload): Result<Credential, string> {
    if(!issuerDB.containsKey(credentialPayload.issuer)) return Result.Err<Credential, string>(`a issuer with address=${credentialPayload.issuer} is not registered`);

    const credential: Credential = {
        did: uuidv4(),
        dateIssued: ic.time(),
        ...credentialPayload
    }

    credentialStorage.insert(credential.did, credential)

    return Result.Ok(credential);
}

$update;
export function deleteCredential(did: string): Result<boolean, string> {

    if(!credentialStorage.containsKey('did')) return Result.Err<boolean, string>('a credential is not found');

    credentialStorage.remove(did);

    return Result.Ok(true);
}

$update;
export function registerIssuerAddress(address: string): Result<string, string> {

    if(issuerDB.containsKey(address)) return Result.Err<string, string>('Issuer already registered');

    issuerDB.insert(address, true);
    
    return Result.Ok(address);
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    /* @ts-ignore */
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};