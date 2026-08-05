# Moi Collection Software - Backend

A Java Spring Boot backend for managing traditional Moi (cash gifts) collections at events, backed by MySQL.

## 🚀 Setup Instructions

1. **Database Setup**
   Ensure MySQL is running on `localhost:3306`.
   Create a database named `moi_db` or let the application create it automatically (configured via `createDatabaseIfNotExist=true` in `application.properties`).

2. **Build and Run the Application**
   From the project root directory (`c:\Users\DELL\Desktop\moi`), run:
   ```bash
   mvn spring-boot:run
   ```
   Or build it and run the jar:
   ```bash
   mvn clean install
   java -jar target/moi-backend-0.0.1-SNAPSHOT.jar
   ```

## 📚 API Endpoints

### Event Management

**1. Create a New Event**
```bash
curl -X POST http://localhost:8080/api/events \
-H "Content-Type: application/json" \
-d '{
  "name": "Karthik Wedding",
  "eventDate": "2026-05-15",
  "location": "Chennai"
}'
```

**2. Get All Events**
```bash
curl http://localhost:8080/api/events
```

### Moi (Transaction) Management

**1. Record a Moi Transaction**
```bash
curl -X POST http://localhost:8080/api/moi \
-H "Content-Type: application/json" \
-d '{
  "eventId": 1,
  "contributorName": "Ramesh",
  "phoneNumber": "9876543210",
  "village": "Madurai",
  "amount": 1001.00,
  "notes": "From Bride side"
}'
```

**2. Get All Transactions for an Event**
```bash
curl http://localhost:8080/api/moi/event/1
```

## Next Steps

- This provides the core backend API for your Moi software.
- The next step typically involves creating a Frontend (e.g., in React or Angular) to interact with these APIs instead of using cURL.
- Let me know if you would like me to build a Frontend interface as well!
