Dustid Lite – Technical Summary 
Overview
Dustid Lite enables customers to send gifts without manually entering delivery addresses by selecting a saved contact. The system securely maps recipient addresses during checkout through platform-specific integrations.
The product operates differently across platforms due to checkout visibility and platform constraints, particularly between Shopify and WooCommerce.

1. Customer Experience (Shopper Side)
Core Requirement (Important Update)
On Shopify
The customer must:

Have a Dustid account
Have saved contacts in the Dustid app

Be granted permission by the recipient to use their address
:point_right: Reason: Shopify exposes address details during checkout, so privacy and consent must be enforced


Frontend Architecture (Shopify)
Theme App Extension (App Block)
Embedded across store pages
Displays Dustid widget
Handles:

Contact selection
Authentication state

Session persistence


State Management
Use localStorage or session storage to persist:

Selected contact

User session


Key Behaviour
Widget visible on:

Home
Collection

Cart
Not visible on checkout (Shopify restriction)



Core Technical Flow (Shopify)

User logs into Dustid
Backend verifies identity
User fetches contacts (filtered by permission)
User selects contact
Selection stored locally
Frontend sends selection to backend
Backend validates permission
Address mapped at checkout
