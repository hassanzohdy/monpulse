# MonPulse

A powerful and easy to use MongoDB driver for `Nodejs`

## Features

MonPulse is a MongoDB driver for Nodejs, it's built on top of the official MongoDB driver, and it provides a simple and easy to use API for working with MongoDB, it is fast, efficient, reliable and will make your life easier with real world apps.

Some but not all of the features:


- **Easy to use:** `MonPulse` is very easy to use, it's just a wrapper around MongoDB driver.
- **Supports multiple connections:** You can perform multiple connections to different MongoDB connections and use each one of them separately.
- **Supports multiple databases:** `MonPulse` supports multiple databases, you can connect to multiple databases at the same time.
- **Powerful Aggregate framework:** `MonPulse` has a powerful aggregate framework that helps you to perform complex queries.
- **Basic CRUD operations:** `MonPulse` supports basic CRUD operations, you can perform create, read, update and delete operations.
- **Events Driven:** `MonPulse` is events driven, you can listen to events and perform actions, for example before creating, updating or deleting a document.
- **Powerful Models:** `MonPulse` has a powerful models system, a Model is a collection manager document based, it manages a collection's document easily with many utilities.
- **Learning curve:** `MonPulse` has a very small learning curve, you can learn it in few minutes.
- **Pagination support:** `MonPulse` supports pagination, you can paginate your results easily.
- **Output formatting:** `MonPulse` supports output formatting, you can format your output easily when model is sent as a response.
- **Auto incremented id:** `MonPulse` supports auto incremented id, you can use it as a primary key for your documents.
- **Random or sequential id:** `MonPulse` supports random or sequential id.
- **Recycle Bin:** Reduce collection documents by removing the document entirely from the collection, but move it to a separate collection trash.
- **Migration system:** `MonPulse` has a migration system, you can create migrations and run them easily.
- **Data casting:** You can cast your data to a specific type or using custom casting.
- **Embedded documents:** `MonPulse` supports single and multiple embedded documents, you can embed documents inside other documents.
- **Syncing Models**: Auto update documents when model's data is updated or deleted.


## Installation

```bash
npm i @mongez/monpulse
```

Using yarn:

```bash
yarn add @mongez/monpulse
```

Using pnpm:

```bash
pnpm add @mongez/monpulse
```


## Peek inside monpulse

Here is a simple example of defining a User model:

```ts title="src/models/user.ts"
import { Model } from "@mongez/monpulse";

export class User extends Model {
  /**
   * The collection name
   * Must be defined explicitly.
   */
  public static collection = "users";
}
```

A quick example of creating a user:

```ts title="src/controllers/users.ts"
import { User } from "src/models/user";

export async function createUser() {
  const user = await User.create({
    name: "Hasan Zohdy",
    email: "hassanzohdy@gmail.com",
  });

  console.log(user.data);
}
```

Outputs something similar to:

```json
{
  "id": 1231412,
  "_id": "fagtrw43qwedasjoijwq",
  "name": "Hasan Zohdy",
  "email": "hassanzohdy@gmail.com",
  "createdAt": "2023-06-01 00:00:00",
  "updatedAt": "2023-06-01 00:00:00"
}
```


## Documentation

To see the full documentation, please visit [monpulse Documentation](https://docs.mentoor.io/mongez/monpulse/getting-started/introduction) 