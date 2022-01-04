# nodecrud
This service allows management and authentication of users. It allows registration of new users, logging in existing users, and CRUD operations on users. Authentication is done through JWT, which is provided on registration and login. The CRUD operations require JWT authentication to perform.

Use npm install to install dependencies.

Run "node secret.js" to generate an access secret and again to generate a refresh secret.

Rename database2.properties to database.properties. Enter in the access secret and refresh secret. Enter in the database information for a MySQL database.

Run "node crudserver.js" to start the server.

See https://documenter.getpostman.com/view/10110930/UVXbsymn for information on endpoints.