import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type Credential = Record<{
  did: string; // id
  issuer: string; // public key of issuer
  identityHolder: string; // public key of identity holder
  body: string; // json body of credential
  title: string; // title of credential
  standard: string; // custom or link to credential standard
  type: string; // KYC balance check and another
  dateIssued: nat64; // date issued
  validTime: nat64; // the valid time of credential
}>;

type CredentialPayload = Record<{
  issuer: string;
  validTime: nat64;
  type: string;
  body: string;
  standard: string;
  title: string;
  identityHolder: string;
}>;

const issuerDB = new StableBTreeMap<string, boolean>(0, 50, 100);
const credentialStorage = new StableBTreeMap<string, Credential>(2, 50, 5000);

$query;
export function checkCredentialDateValidity(
  did: string
): Result<boolean, string> {
  return match(credentialStorage.get(did), {
    Some: (credential) => {
      const currentTime = ic.time();
      const timeDifference = currentTime - credential.dateIssued;
      if (timeDifference > credential.validTime)
        return Result.Ok<boolean, string>(false);

      return Result.Ok<boolean, string>(true);
    },
    None: () =>
      Result.Err<boolean, string>(`a credential with did=${did} not found`),
  });
}

$query;
export function getAllCredentialDatabase(): Result<Vec<Credential>, string> {
  try {
    return Result.Ok(credentialStorage.values());
  } catch (error) {
    return Result.Err(`Error retrieving credential database: ${error}`);
  }
}

$query;
export function getCredential(did: string): Result<Credential, string> {
  // Suggestion 1: Validate the input 'did' before using it to get data from the credentialStorage.
  if (!did) {
    return Result.Err<Credential, string>("Invalid input: did is required");
  }
  try {
    return match(credentialStorage.get(did), {
      Some: (credential) => Result.Ok<Credential, string>(credential),
      None: () =>
        Result.Err<Credential, string>(
          `a credential with did=${did} not found`
        ),
    });
  } catch (error) {
    return Result.Err<Credential, string>(
      `Error retrieving credential: ${error}`
    );
  }
}

$query;
export function getCurrentTime(): Result<nat64, string> {
  try {
    const currentTime = ic.time();
    return Result.Ok(currentTime);
  } catch (error) {
    return Result.Err(`Failed to get current time: ${error}`);
  }
}

$query;
export function getIssuerDatabaseKeys(): Result<Vec<string>, string> {
  try {
    return Result.Ok(issuerDB.keys());
  } catch (error) {
    return Result.Err(`Failed to access issuerDB keys: ${error}`);
  }
}

$update;
export function issueCredential(
  credentialPayload: CredentialPayload
): Result<Credential, string> {
  if (!issuerDB.containsKey(credentialPayload.issuer))
    return Result.Err<Credential, string>(
      `a issuer with address=${credentialPayload.issuer} is not registered`
    );

  if (!validateCredentialPayload(credentialPayload))
    return Result.Err<Credential, string>("Invalid credential payload");

  const credential: Credential = {
    did: uuidv4(),
    dateIssued: ic.time(),
    ...credentialPayload,
  };

  try {
    credentialStorage.insert(credential.did, credential);
  } catch (error) {
    return Result.Err<Credential, string>(
      `error occurred during insert: ${error}`
    );
  }

  return Result.Ok(credential);
}

/**
 * Validates the credential payload to ensure it meets the expected format and contains all required fields.
 * @param credentialPayload The credential payload to be validated.
 * @returns True if the payload is valid, false otherwise.
 */

function validateCredentialPayload(
  credentialPayload: CredentialPayload
): boolean {
  // Check if validTime is a positive number
  if (credentialPayload.validTime <= 0) {
    return false;
  }

  // Additional validation rules can be added here based on your requirements

  // All validation checks passed, return true
  return true;
}

$update;
export function deleteCredential(did: string): Result<string, string> {
  // Suggestion 3: Validate the input 'did'
  if (!did || typeof did !== "string" || did.trim() === "") {
    return Result.Err<string, string>("Invalid 'did' parameter");
  }

  // Suggestion 2: Return a more specific error message when a credential is not found
  if (!credentialStorage.containsKey(did)) {
    return Result.Err<string, string>(`Credential with id ${did} not found`);
  }

  credentialStorage.remove(did);

  // Suggestion 1: Return a more meaningful success message
  return Result.Ok(`Credential with id ${did} successfully deleted`);
}

$update;
export function registerIssuerAddress(address: string): Result<string, string> {
  if (issuerDB.containsKey(address))
    return Result.Err<string, string>(
      "Issuer with address " + address + " is already registered"
    );

  try {
    issuerDB.insert(address, true);
    return Result.Ok(address);
  } catch (error) {
    return Result.Err<string, string>("Failed to register issuer");
  }
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
  },
};
