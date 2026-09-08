// Run only against a disposable, migrated and seeded MySQL database.
const assert = require('node:assert/strict');
if (process.env.MYSQL_INTEGRATION_TEST !== '1' || !process.env.DATABASE_URL ||
    new URL(process.env.DATABASE_URL).port !== '53309') {
  throw new Error('Requires MYSQL_INTEGRATION_TEST=1 and disposable MySQL on port 53309');
}
process.env.REDIS_URL = '';
const { query, transaction, pool } = require('../dist/src/config/db');
const service = (file, name) => require('../dist/src/services/' + file)[name];
const A = service('authService','AuthService');
const P = service('profileService','ProfileService');
const L = service('listingService','ListingService');
const B = service('bookingService','BookingService');
const R = service('reviewService','ReviewService');
const O = service('ownerService','OwnerService');
const F = service('platformService','PlatformService');
const U = service('userService','UserService');
const Legal = service('legalService','LegalService');
const D = service('adminService','AdminDashboardService');
const M = service('adminService','AdminApprovalService');
let passed=0;
async function check(name, fn) { await fn(); passed++; console.log('PASS '+name); }
async function main() {
 const token=Date.now();
 let user, listing, booking, owner, announcement;
 const password='Integration-test-2026!';
 await check('UTC, booleans and transaction rollback', async()=>{
  const r=await query("SELECT @@session.time_zone AS zone, false AS is_active, true AS has_review");
  assert.equal(r.rows[0].zone,'+00:00'); assert.equal(r.rows[0].is_active,false); assert.equal(r.rows[0].has_review,true);
  await assert.rejects(transaction(async c=>{await c.query('INSERT INTO locations(name) VALUES (?)',['rollback-'+token]); throw Error('rollback');}));
  assert.equal((await query('SELECT * FROM locations WHERE name=?',['rollback-'+token])).rowCount,0);
 });
 await check('register, login, duplicate account and legal consent', async()=>{
  const data={first_name:'Test',last_name:'MySQL',email:'mysql-'+token+'@example.com',password,acceptTerms:true,language:'en'};
  user=await A.register(data); assert.ok(user.userId);
  assert.equal((await A.authenticate(data.email,password)).requiresTermsAcceptance,false);
  await assert.rejects(A.register(data),{statusCode:409});
  await Legal.current('terms','en'); await Legal.acceptTerms(user.userId,'fr'); await Legal.acceptTerms(user.userId,'fr');
 });
 await check('profile edits, contact/session version, summary and users',async()=>{
  await P.update(user.userId,'Updated','MySQL'); await P.updateAvatar(user.userId,'https://example.com/test.jpg');
  await P.updateContact(user.userId,{email:'changed-'+token+'@example.com',phone:'+212612345678',currentPassword:password});
  assert.equal((await A.authenticate('changed-'+token+'@example.com',password)).sessionVersion,user.sessionVersion+1);
  await P.summary(user.userId); await U.findAll({search:'Updated MySQL',page:1,limit:10}); await U.findById(user.userId);
 });
 await check('listing create, edit, images and availability blocks',async()=>{
  listing=await L.create({providerId:user.userId,categoryId:1,areaId:1,propertyTypeId:1,title:'MySQL test',basePrice:125,pricingUnit:'night',imageUrls:['https://example.com/test.jpg'],featureIds:[1],categoryIds:[1]});
  assert.ok(listing.listingId); assert.equal(listing.isActive,false);
  await L.update(listing.listingId,1,'ADMIN',{title:'MySQL updated',basePrice:150});
  await L.appendImages(listing.listingId,1,'ADMIN',['https://example.com/test2.jpg']);
  const images=await query('SELECT id FROM listing_images WHERE listing_id=?',[listing.listingId]);
  await L.reorderImages(listing.listingId,1,'ADMIN',images.rows.map(r=>r.id).reverse());
  const block=await L.addAvailabilityBlock(listing.listingId,1,'ADMIN',new Date('2035-01-01'),new Date('2035-01-02'),'test');
  await L.removeAvailabilityBlock(listing.listingId,block.blockId,'ADMIN');
 });
 await check('admin queue, claim, decision, metrics and dashboard',async()=>{
  const queue=await M.queue(1,{scope:'all',page:1,limit:100});
  const item=queue.items.find(i=>i.entityType==='listing' && i.entityId===listing.listingId); assert.ok(item);
  await M.claim(item.caseId,1); await M.decide(item.caseId,1,'ADMIN',{decision:'approved',reasonCode:'verified'});
  await M.history(1); await M.metrics(1); assert.equal((await D.overview(7)).trend.length,7);
  await D.audit({page:1,limit:10,actorId:1,entityType:'listing'});
 });
 await check('listing discovery, filters and favorites',async()=>{
  await L.findAll({page:1,limit:10,search:'MySQL'}); await L.findMine(user.userId); await L.featured();
  await L.search({page:1,limit:10,checkIn:new Date('2030-01-01'),checkOut:new Date('2030-01-03'),cityId:1,amenityIds:[1]});
  await L.propertyDiscoveryOptions();
  assert.equal((await F.toggleFavorite(user.userId,listing.listingId)).saved,true);
  assert.equal((await F.getFavorites(user.userId)).length,1);
  assert.equal((await F.toggleFavorite(user.userId,listing.listingId)).saved,false);
 });
 await check('booking pricing, overlap protection, review and updates',async()=>{
  const data={listingId:listing.listingId,userId:user.userId,startDate:'2030-01-01T12:00:00.000Z',endDate:'2030-01-03T12:00:00.000Z',firstName:'Test',lastName:'User',email:user.email,phone:'+212612345678'};
  booking=await B.create(data); assert.equal(booking.total,300);
  await assert.rejects(B.create(data),{statusCode:409});
  await B.findAll(user.userId,{state:'all',search:'Test User',page:1,pageSize:10}); await B.findById(booking.bookingId);
  await M.reviewBooking(booking.bookingId,1,'ADMIN','confirmed');
  await B.update(booking.bookingId,1,'ADMIN',{endDate:new Date('2030-01-04T12:00:00Z'),status:'completed'});
  const review=await R.create(user.userId,{bookingId:booking.bookingId,rating:5,comment:'Great'});
  await R.mine(user.userId); await R.update(review.reviewId,user.userId,'CLIENT',{rating:4,comment:'Updated'});
  await R.delete(review.reviewId,user.userId,'CLIENT');
  await B.delete(booking.bookingId,'ADMIN');
  const concurrent={...data,startDate:'2031-01-01T12:00:00.000Z',endDate:'2031-01-03T12:00:00.000Z'};
  const attempts=await Promise.allSettled([B.create(concurrent),B.create(concurrent)]);
  assert.equal(attempts.filter(a=>a.status==='fulfilled').length,1);
  assert.equal(attempts.filter(a=>a.status==='rejected').length,1);
  const winner=attempts.find(a=>a.status==='fulfilled').value;
  await B.delete(winner.bookingId,'ADMIN');
 });
 await check('owner property creation and existing-owner upsert',async()=>{
  const data={firstName:'Owner',lastName:'Test',nationalIdCode:'TEST'+token,phone:'+212612345678',areaId:1,propertyTypeId:1,title:'Owner test',nightlyPrice:200,contractNumber:'TEST-'+token,locationText:'Test location'};
  owner=await O.createProperty(data,1,{photoUrl:null,contractUrl:null,imageUrls:[]});
  const second=await O.createProperty({...data,contractNumber:'SECOND-'+token},1,{photoUrl:null,contractUrl:null,imageUrls:[]});
  assert.equal(second.ownerId,owner.ownerId); await O.list({search:'Owner Test',page:1,limit:10}); await O.get(owner.ownerId);
 });
 await check('publication request and approval',async()=>{
  const type=(await query('SELECT slug FROM property_types WHERE property_type_id=1')).rows[0].slug;
  const changes=await F.createAnnouncement({requesterId:user.userId,propertyTypeSlug:type,rentalTerm:'short_term',title:'Changes test',description:'Integration test',locationName:'Test',mapUrl:null,basePrice:100,pricingUnit:'night',guestCapacity:2,contactName:'Test',contactPhone:'+212612345678',contactEmail:user.email,imageUrls:[]});
  const queue=await M.queue(1,{scope:'all',page:1,limit:100});
  const changeCase=queue.items.find(i=>i.entityType==='announcement' && i.entityId===changes.request_id); assert.ok(changeCase);
  await M.decide(changeCase.caseId,1,'ADMIN',{decision:'changes_requested',reasonCode:'more_info'});
  assert.equal((await query('SELECT status FROM announcement_requests WHERE request_id=?',[changes.request_id])).rows[0].status,'ESCALATED');
  announcement=await F.createAnnouncement({requesterId:user.userId,propertyTypeSlug:type,rentalTerm:'short_term',title:'Publication test',description:'Integration test',locationName:'Test',mapUrl:null,basePrice:100,pricingUnit:'night',guestCapacity:2,contactName:'Test',contactPhone:'+212612345678',contactEmail:user.email,imageUrls:[]});
  await F.listAnnouncements();
  assert.ok((await F.reviewAnnouncement(announcement.request_id,1,'ADMIN','APPROVED')).listingId);
 });
 await check('password change and safe account deactivation',async()=>{
  await A.changePassword(user.userId,password,password+'new');
  await A.verifyCurrentPassword(user.userId,password+'new');
  await P.deactivate(user.userId,password+'new');
  await assert.rejects(A.authenticate('changed-'+token+'@example.com',password+'new'),{statusCode:403});
 });
 console.log(passed+' MySQL integration groups passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>pool.end());
