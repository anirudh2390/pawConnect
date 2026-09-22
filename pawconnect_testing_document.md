<div style="display: flex; justify-content: space-between; font-weight: bold; text-transform: uppercase;">
  <span>PawConnect</span>
  <span>STD</span>
</div>
<hr>

# TESTING DOCUMENTATION

## SYSTEM TESTING

### Introduction
This testing document describes the testing activities performed for the PawConnect platform. The purpose of testing is to verify that the system functions correctly according to the specified requirements and that the major features work as expected. The document includes the test plan and test procedures for the application. The testing covers Unit Testing, Integration Testing, and System Testing.

### Test Plan
The test plan defines the strategy and activities used to verify the functionality and quality of PawConnect. Testing will be performed on the major modules of the system, including user authentication, pet listings, adoption requests, real-time chat, admin moderation, and the AI Assistant. The testing will include Unit Testing, Integration Testing, and System Testing. The objective is to identify errors, verify that the modules work correctly individually and together, and ensure that the complete system meets the required functionality.

### Test Cases
The test cases are designed to verify the functionality of the different components of PawConnect. Each test case specifies the test objective, pre-condition, test steps, test data, expected result, and post-condition.

#### Unit Test Cases

| Test Case ID | Test Objective | Pre-condition | Steps/Cases | Test Data | Expected Result | Post-condition |
| --- | --- | --- | --- | --- | --- | --- |
| **TC_AUTH_01** | Verify that a valid user can successfully register an account. | System is accessible via a browser. | 1. Navigate to Registration page<br>2. Enter Name, Email, Password<br>3. Click "Sign Up" | Valid Name, Email, Password | System creates the account and redirects to Login/Dashboard. | User record is created in the database. |
| **TC_AUTH_02** | Verify that a valid user can successfully log in. | A valid User account exists. | 1. Navigate to Login page<br>2. Enter Email and Password<br>3. Click "Login" | Valid Email and Password | System authenticates the user and redirects to the dashboard. | User session is created. |
| **TC_PET_01** | Verify that a user can create a pet listing. | User is logged in and authenticated. | 1. Navigate to "Create Listing"<br>2. Fill in pet details<br>3. Upload Pet Image<br>4. Click "Submit" | Valid pet details and an image file | Listing is successfully created and submitted for Admin review. | Pet record is added to DB with status 'Pending'. |
| **TC_PET_02** | Verify that a user can search and filter pet listings. | Approved pet listings exist in the system. | 1. Navigate to Browse page<br>2. Apply filters (e.g., Species, Age)<br>3. View results | Filter criteria (e.g., Species: Dog) | Matching pet records are displayed according to the filter criteria. | None |
| **TC_ADPT_01** | Verify that a user can submit an adoption request. | User is logged in and viewing an 'Available' pet. | 1. Open a Pet Details page<br>2. Click "Submit Adoption Request"<br>3. Confirm submission | N/A | Request is sent to the pet owner and success notification is shown. | AdoptionRequest record created with 'Pending' status. |
| **TC_ADPT_02** | Verify that an owner can review an adoption request. | Owner is logged in and has a pending request. | 1. Go to Incoming Requests<br>2. Select a pending request<br>3. Click "Approve Request" | N/A | Request is approved and pet status is updated. | Pet status updated to 'Adopted'. |
| **TC_CHAT_01** | Verify that a user can send a chat message. | Users have an active adoption context. | 1. Open Chat interface<br>2. Type a message<br>3. Click "Send" | "Hello, I want to adopt" | Message is instantly delivered and displayed in chat history. | Message record is saved in MongoDB. |
| **TC_ADM_01** | Verify that an admin can approve a pet listing. | Admin is logged in, pending listings exist. | 1. Go to Admin Dashboard<br>2. Review a Pending Pet Listing<br>3. Click "Approve" | N/A | Pet listing becomes publicly visible on the platform. | Pet status updated to 'Available' in DB. |
| **TC_AI_01** | Verify that the AI Chatbot provides responses to user queries. | System is accessible, Gemini API key is valid. | 1. Click the floating chatbot icon<br>2. Type a question<br>3. Click "Send" | "How do I adopt a dog?" | Chatbot responds intelligently, providing relevant information. | Message history is updated with the response. |
| **TC_UI_01** | Verify that dynamic global backgrounds are applied based on the route. | System is accessible via browser. | 1. Navigate between Landing, Browse, and Auth pages | N/A | Fullscreen background image changes dynamically based on the route. | Global theme successfully applied via RootLayout. |

#### Integration Test Cases

| Test Case ID | Test Objective | Pre-condition | Steps/Cases | Test Data | Expected Result | Post-condition |
| --- | --- | --- | --- | --- | --- | --- |
| **TC_INT_01** | Verify that the Adoption Request module correctly interacts with the Pet Listing and User modules. | User and Pet records exist in the system. | 1. Submit an adoption request<br>2. Log in as the pet owner<br>3. Check incoming requests | N/A | The adoption request is successfully linked with the selected pet and the owner receives it. | The adoption request contains the correct Adopter and Pet references. |
| **TC_INT_02** | Verify that the Chat module correctly links messages between users based on the adoption context. | An active adoption request exists between two users. | 1. Open chat from the adoption request<br>2. Send a message<br>3. Log in as the recipient | Message content | The message is successfully delivered to the correct recipient in the context of the specific pet adoption. | The chat message is associated with the correct AdoptionRequest ID. |
| **TC_INT_03** | Verify that the Admin module correctly interacts with the Pet Listing module to update visibility. | A pending pet listing exists. | 1. Admin approves the listing<br>2. Navigate to Browse page as a user | N/A | The approved pet listing is successfully displayed on the public Browse page. | The pet has the 'Available' status and is accessible by users. |
| **TC_INT_04** | Verify that the AI Chatbot correctly integrates with ReactMarkdown to display formatted responses. | The AI Chatbot is open. | 1. Send a prompt that requires formatting<br>2. Observe the UI rendering | "Give me 3 tips for pet care" | The chatbot response is successfully parsed and displayed with proper markdown formatting (bullet points, bold text). | None |

#### System Test Cases

| Test Case ID | Test Objective | Pre-condition | Steps/Cases | Test Data | Expected Result | Post-condition |
| --- | --- | --- | --- | --- | --- | --- |
| **TC_SYS_01** | Verify the complete user authentication workflow. | System is accessible. | 1. Register a new user<br>2. Log out<br>3. Log in with the new credentials | Valid User Details | The system successfully registers the user, authenticates them on login, and grants access to the dashboard. | The authenticated user can access permitted system features. |
| **TC_SYS_02** | Verify the complete pet adoption workflow. | Users are registered. | 1. User A creates a pet listing<br>2. Admin approves it<br>3. User B searches and finds the pet<br>4. User B submits an adoption request | Valid Pet Details, Search Filters | The system successfully guides the pet from creation and approval to discovery and request submission. | The pet has a pending adoption request associated with User B. |
| **TC_SYS_03** | Verify the complete communication and adoption finalization workflow. | An adoption request is pending. | 1. Owner reviews the request<br>2. Owner and Adopter exchange messages via Chat<br>3. Owner approves the request | Chat Messages | The users can seamlessly communicate, and the owner can successfully finalize the adoption. | The pet is marked as 'Adopted' and both users have access to chat history. |
| **TC_SYS_04** | Verify the complete AI Assistant experience using the floating widget. | User is on the platform. | 1. Click the floating chatbot<br>2. Ask an adoption-related question<br>3. Receive response | Query: "What should I feed a puppy?" | The AI Assistant identifies the query, fetches a response, and provides the requested information in a user-friendly chat interface. | The user receives the information through the AI Assistant. |

<br><br><br>
<hr>
<div style="display: flex; justify-content: space-between;">
  <span>UCC- MCA</span>
  <span>1</span>
</div>
