import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SVF CRM database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.campaignLead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.salesOrderLineItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.dealStageHistory.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create password hash
  const passwordHash = await argon2.hash('Demo@1234', { type: argon2.argon2id });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@svfcrm.com',
      fullName: 'SVF Admin',
      phone: '+91 9876543210',
      passwordHash,
      emailVerified: true,
    },
  });

  // Create sales rep user
  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@svfcrm.com',
      fullName: 'Priya Sharma',
      phone: '+91 9876543211',
      passwordHash,
      emailVerified: true,
    },
  });

  const salesUser2 = await prisma.user.create({
    data: {
      email: 'rep2@svfcrm.com',
      fullName: 'Rahul Kumar',
      phone: '+91 9876543212',
      passwordHash,
      emailVerified: true,
    },
  });

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Business Pvt Ltd',
      slug: 'demo-business-pvt-ltd',
      phone: '+91 9876500000',
      email: 'contact@demobusiness.com',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
  });

  // Create memberships
  const adminMembership = await prisma.organizationMembership.create({
    data: { userId: adminUser.id, organizationId: organization.id, role: 'ORG_ADMIN' },
  });

  const salesMembership = await prisma.organizationMembership.create({
    data: { userId: salesUser.id, organizationId: organization.id, role: 'SALES_REP' },
  });

  const salesMembership2 = await prisma.organizationMembership.create({
    data: { userId: salesUser2.id, organizationId: organization.id, role: 'SALES_REP' },
  });

  // Create Accounts
  const accounts = await Promise.all([
    prisma.account.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, name: 'TechCorp Solutions', industry: 'Technology', website: 'https://techcorp.example.com', email: 'contact@techcorp.example.com', phone: '+91 44 2345 6789', annualRevenue: 5000000, companySize: '51-200', billingAddress: '123 Anna Salai, Chennai, TN 600002' } }),
    prisma.account.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, name: 'Global Manufacturing Co', industry: 'Manufacturing', website: 'https://globalman.example.com', email: 'info@globalman.example.com', phone: '+91 22 3456 7890', annualRevenue: 12000000, companySize: '201-500' } }),
    prisma.account.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, name: 'FinServe Partners', industry: 'Financial Services', email: 'office@finserve.example.com', phone: '+91 80 4567 8901', annualRevenue: 8000000, companySize: '11-50' } }),
    prisma.account.create({ data: { organizationId: organization.id, ownerId: salesMembership2.id, name: 'RetailMax India', industry: 'Retail', email: 'support@retailmax.example.com', phone: '+91 40 5678 9012', annualRevenue: 3000000, companySize: '51-200' } }),
    prisma.account.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, name: 'HealthCare Innovations', industry: 'Healthcare', email: 'contact@healthcarein.example.com', annualRevenue: 7500000, companySize: '11-50' } }),
  ]);

  // Create Contacts
  const contacts = await Promise.all([
    prisma.contact.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, accountId: accounts[0].id, firstName: 'Arun', lastName: 'Krishnamurthy', email: 'arun@techcorp.example.com', phone: '+91 98765 43210', jobTitle: 'CTO', department: 'Technology', city: 'Chennai', state: 'Tamil Nadu', country: 'India' } }),
    prisma.contact.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, accountId: accounts[1].id, firstName: 'Meera', lastName: 'Patel', email: 'meera@globalman.example.com', phone: '+91 87654 32109', jobTitle: 'Procurement Manager', department: 'Operations', city: 'Mumbai', state: 'Maharashtra', country: 'India' } }),
    prisma.contact.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, accountId: accounts[2].id, firstName: 'Vikram', lastName: 'Singh', email: 'vikram@finserve.example.com', phone: '+91 76543 21098', jobTitle: 'CFO', department: 'Finance', city: 'Bengaluru', state: 'Karnataka', country: 'India' } }),
    prisma.contact.create({ data: { organizationId: organization.id, ownerId: salesMembership2.id, accountId: accounts[3].id, firstName: 'Ananya', lastName: 'Reddy', email: 'ananya@retailmax.example.com', phone: '+91 65432 10987', jobTitle: 'Store Director', city: 'Hyderabad', state: 'Telangana', country: 'India' } }),
    prisma.contact.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, accountId: accounts[4].id, firstName: 'Suresh', lastName: 'Venkataraman', email: 'suresh@healthcarein.example.com', phone: '+91 54321 09876', jobTitle: 'CEO', city: 'Bengaluru', state: 'Karnataka', country: 'India' } }),
    prisma.contact.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, firstName: 'Deepa', lastName: 'Nair', email: 'deepa.nair@example.com', phone: '+91 43210 98765', jobTitle: 'Marketing Head', city: 'Kochi', state: 'Kerala', country: 'India' } }),
  ]);

  // Create Leads
  const leads = await Promise.all([
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, firstName: 'Rajesh', lastName: 'Iyer', company: 'Sunrise Textiles', email: 'rajesh@sunrise.example.com', phone: '+91 99887 66554', source: 'WEBSITE', status: 'NEW', rating: 'HOT', industry: 'Textiles', annualRevenue: 2000000 } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, firstName: 'Kavitha', lastName: 'Menon', company: 'Digital Edge Agency', email: 'kavitha@digitaledge.example.com', phone: '+91 88776 55443', source: 'REFERRAL', status: 'CONTACTED', rating: 'WARM', industry: 'Marketing' } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: salesMembership2.id, firstName: 'Mohan', lastName: 'Das', company: 'Green Energy Ltd', email: 'mohan@greenenergy.example.com', phone: '+91 77665 44332', source: 'SOCIAL_MEDIA', status: 'QUALIFIED', rating: 'HOT', industry: 'Energy', annualRevenue: 6000000, numberOfEmployees: 120 } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, firstName: 'Sita', lastName: 'Ramanujan', company: 'Spice Route Foods', email: 'sita@spiceroute.example.com', phone: '+91 66554 33221', source: 'EMAIL_CAMPAIGN', status: 'NEW', industry: 'Food & Beverage' } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, firstName: 'Karthik', lastName: 'Balaji', company: 'AutoParts Direct', email: 'karthik@autoparts.example.com', phone: '+91 55443 22110', source: 'COLD_CALL', status: 'UNQUALIFIED', industry: 'Automotive' } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: salesMembership2.id, firstName: 'Lakshmi', lastName: 'Sundaram', company: 'Pearl Jewels', email: 'lakshmi@pearljewels.example.com', phone: '+91 44332 11009', source: 'ADVERTISEMENT', status: 'CONTACTED', rating: 'WARM', industry: 'Jewelry' } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, firstName: 'Ganesh', lastName: 'Krishnan', company: 'TechStart Solutions', email: 'ganesh@techstart.example.com', phone: '+91 33221 00998', source: 'WEBSITE', status: 'QUALIFIED', rating: 'HOT', industry: 'Technology', annualRevenue: 800000 } }),
    prisma.lead.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, firstName: 'Divya', lastName: 'Pillai', company: 'EduPath Academy', email: 'divya@edupath.example.com', phone: '+91 22110 99887', source: 'REFERRAL', status: 'NEW', industry: 'Education' } }),
  ]);

  // Create Deals
  const now = new Date();
  const deals = await Promise.all([
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, contactId: contacts[0].id, accountId: accounts[0].id, name: 'TechCorp - CRM Enterprise License', amount: 450000, stage: 'PROPOSAL', probability: 65, expectedCloseDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), source: 'WEBSITE' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, contactId: contacts[1].id, accountId: accounts[1].id, name: 'Global Manufacturing - Supply Chain Module', amount: 280000, stage: 'NEGOTIATION', probability: 80, expectedCloseDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), source: 'REFERRAL' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, contactId: contacts[2].id, accountId: accounts[2].id, name: 'FinServe - Analytics Dashboard', amount: 180000, stage: 'CLOSED_WON', probability: 100, expectedCloseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), closedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), source: 'EMAIL_CAMPAIGN' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: salesMembership2.id, contactId: contacts[3].id, accountId: accounts[3].id, name: 'RetailMax - POS Integration', amount: 95000, stage: 'QUALIFICATION', probability: 10, expectedCloseDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), source: 'COLD_CALL' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, contactId: contacts[4].id, accountId: accounts[4].id, name: 'HealthCare - Patient Management System', amount: 620000, stage: 'NEEDS_ANALYSIS', probability: 25, expectedCloseDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), source: 'REFERRAL' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: adminMembership.id, contactId: contacts[0].id, accountId: accounts[0].id, name: 'TechCorp - Mobile App Development', amount: 320000, stage: 'CLOSED_WON', probability: 100, expectedCloseDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), closedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), source: 'WEBSITE' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: salesMembership2.id, contactId: contacts[5].id, name: 'Deepa Nair - Consulting Package', amount: 75000, stage: 'CLOSED_LOST', probability: 0, closedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), lossReason: 'Budget constraints', source: 'WEBSITE' } }),
    prisma.deal.create({ data: { organizationId: organization.id, ownerId: salesMembership.id, contactId: contacts[5].id, name: 'Deepa Nair - Marketing Automation', amount: 55000, stage: 'PROSPECTING', probability: 5, expectedCloseDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), source: 'REFERRAL' } }),
  ]);

  // Create Products
  const products = await Promise.all([
    prisma.product.create({ data: { organizationId: organization.id, name: 'CRM Starter Plan', sku: 'CRM-STR-001', description: 'Up to 5 users, basic CRM features', unitPrice: 2999, currency: 'INR', category: 'Software', isActive: true } }),
    prisma.product.create({ data: { organizationId: organization.id, name: 'CRM Professional Plan', sku: 'CRM-PRO-002', description: 'Up to 25 users, advanced features', unitPrice: 7999, currency: 'INR', category: 'Software', isActive: true } }),
    prisma.product.create({ data: { organizationId: organization.id, name: 'CRM Enterprise Plan', sku: 'CRM-ENT-003', description: 'Unlimited users, full feature set', unitPrice: 19999, currency: 'INR', category: 'Software', isActive: true } }),
    prisma.product.create({ data: { organizationId: organization.id, name: 'Implementation Service', sku: 'SVC-IMP-001', description: 'Professional implementation and setup', unitPrice: 49999, currency: 'INR', category: 'Service', isActive: true } }),
    prisma.product.create({ data: { organizationId: organization.id, name: 'Training Package', sku: 'SVC-TRN-001', description: '8-hour training session for your team', unitPrice: 15000, currency: 'INR', category: 'Service', isActive: true } }),
  ]);

  // Create Tasks
  await Promise.all([
    prisma.task.create({ data: { organizationId: organization.id, assigneeId: salesMembership.id, dealId: deals[0].id, title: 'Follow up on TechCorp proposal', priority: 'HIGH', status: 'NOT_STARTED', dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) } }),
    prisma.task.create({ data: { organizationId: organization.id, assigneeId: adminMembership.id, dealId: deals[1].id, title: 'Send revised pricing to Global Manufacturing', priority: 'URGENT', status: 'IN_PROGRESS', dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) } }),
    prisma.task.create({ data: { organizationId: organization.id, assigneeId: salesMembership2.id, leadId: leads[0].id, title: 'Schedule demo for Rajesh Iyer', priority: 'MEDIUM', status: 'NOT_STARTED', dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) } }),
    prisma.task.create({ data: { organizationId: organization.id, assigneeId: adminMembership.id, title: 'Q4 sales review preparation', priority: 'HIGH', status: 'NOT_STARTED', dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) } }), // overdue
    prisma.task.create({ data: { organizationId: organization.id, assigneeId: salesMembership.id, contactId: contacts[3].id, title: 'Send onboarding docs to Ananya Reddy', priority: 'MEDIUM', status: 'COMPLETED', completedAt: new Date() } }),
    prisma.task.create({ data: { organizationId: organization.id, assigneeId: salesMembership2.id, title: 'Monthly report submission', priority: 'HIGH', status: 'NOT_STARTED', dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) } }), // overdue
  ]);

  // Create Activities
  await Promise.all([
    prisma.activity.create({ data: { organizationId: organization.id, type: 'CALL', title: 'Discovery call with Arun', description: 'Initial discovery call about CRM requirements', contactId: contacts[0].id, dealId: deals[0].id, scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { organizationId: organization.id, type: 'MEETING', title: 'Product demo for HealthCare team', description: 'Full product demonstration', contactId: contacts[4].id, dealId: deals[4].id, scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), duration: 60 } }),
    prisma.activity.create({ data: { organizationId: organization.id, type: 'FOLLOW_UP', title: 'Follow up with Meera on proposal', contactId: contacts[1].id, dealId: deals[1].id, scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), outcome: 'Meera confirmed she will review and get back by tomorrow' } }),
    prisma.activity.create({ data: { organizationId: organization.id, type: 'EMAIL', title: 'Sent proposal to TechCorp', contactId: contacts[0].id, dealId: deals[0].id, scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), outcome: 'Email delivered successfully' } }),
    prisma.activity.create({ data: { organizationId: organization.id, type: 'CALL', title: 'Onboarding call - FinServe', contactId: contacts[2].id, dealId: deals[2].id, scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), duration: 90 } }),
  ]);

  // Create Campaigns
  await Promise.all([
    prisma.campaign.create({ data: { organizationId: organization.id, name: 'Q4 Email Campaign - CRM Solutions', type: 'EMAIL', status: 'ACTIVE', startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), budget: 50000, expectedRevenue: 500000, description: 'Targeting SMBs in the technology sector' } }),
    prisma.campaign.create({ data: { organizationId: organization.id, name: 'LinkedIn Outreach - Manufacturing', type: 'SOCIAL_MEDIA', status: 'ACTIVE', startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), budget: 30000, expectedRevenue: 300000 } }),
    prisma.campaign.create({ data: { organizationId: organization.id, name: 'Webinar - CRM Best Practices', type: 'EVENT', status: 'PLANNING', startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), budget: 20000, expectedRevenue: 200000 } }),
  ]);

  // Create Notes
  await Promise.all([
    prisma.note.create({ data: { organizationId: organization.id, leadId: leads[0].id, content: 'Rajesh is very interested in automating his sales process. He has a team of 10 sales reps.', authorId: adminUser.id } }),
    prisma.note.create({ data: { organizationId: organization.id, contactId: contacts[0].id, content: 'Arun prefers communication via email. He will be the primary technical decision maker.', authorId: adminUser.id } }),
    prisma.note.create({ data: { organizationId: organization.id, dealId: deals[0].id, content: 'Proposal sent on Oct 28. TechCorp wants a demo of the reporting module specifically.', authorId: adminUser.id } }),
  ]);

  // Create Notifications
  await Promise.all([
    prisma.notification.create({ data: { organizationId: organization.id, userId: adminUser.id, type: 'TASK_OVERDUE', title: 'Task Overdue', message: 'Your task "Q4 sales review preparation" is overdue', recordId: deals[0].id, recordType: 'deal' } }),
    prisma.notification.create({ data: { organizationId: organization.id, userId: salesUser.id, type: 'LEAD_ASSIGNED', title: 'New Lead Assigned', message: 'Kavitha Menon has been assigned to you', recordId: leads[1].id, recordType: 'lead' } }),
    prisma.notification.create({ data: { organizationId: organization.id, userId: adminUser.id, type: 'DEAL_CLOSING_SOON', title: 'Deal Closing Soon', message: 'Global Manufacturing deal is closing in 15 days', recordId: deals[1].id, recordType: 'deal' } }),
    prisma.notification.create({ data: { organizationId: organization.id, userId: adminUser.id, type: 'DEAL_STAGE_CHANGED', title: 'Deal Stage Updated', message: 'FinServe - Analytics Dashboard has been marked as Closed Won!', recordId: deals[2].id, recordType: 'deal', isRead: true } }),
  ]);

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Demo Accounts:');
  console.log('  Admin:     admin@svfcrm.com   / Demo@1234');
  console.log('  Sales Rep: sales@svfcrm.com   / Demo@1234');
  console.log('  Sales Rep: rep2@svfcrm.com    / Demo@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
