import { query, transaction } from '../../src/config/db';
import { ListingService } from '../../src/services/listingService';
import { AdminApprovalService } from '../../src/services/adminService';
import { PlatformService } from '../../src/services/platformService';
import { UserService } from '../../src/services/userService';

jest.mock('../../src/config/db', () => ({ query: jest.fn(), transaction: jest.fn() }));
const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedTransaction = transaction as jest.MockedFunction<typeof transaction>;

describe('service-layer canonical role boundaries', () => {
  beforeEach(() => { mockedQuery.mockReset(); mockedTransaction.mockReset(); });

  test.each(['CLIENT', 'OWNER', 'moderator', 'admin'])(
    'prevents %s from changing listing approval status',
    async role => {
      await expect(ListingService.setStatus(3, 9, role, 'approved'))
        .rejects.toMatchObject({ statusCode: 403 });
      expect(mockedTransaction).not.toHaveBeenCalled();
    },
  );

  test('prevents an owner from approving publication requests', async () => {
    await expect(PlatformService.reviewAnnouncement(2, 9, 'OWNER', 'APPROVED', 'no'))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  test('prevents an owner from deleting a property through the service layer', async () => {
    jest.spyOn(ListingService, 'findById').mockResolvedValueOnce({ listingId: 3, providerId: 9 } as never);
    await expect(ListingService.delete(3, 9, 'OWNER'))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  test('prevents a client from submitting approval decisions', async () => {
    await expect(AdminApprovalService.decide(2, 9, 'CLIENT', {
      decision: 'approved', reasonCode: 'bypass',
    })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  test('prevents non-admin service callers from changing user roles', async () => {
    await expect(UserService.setRole(2, 'OWNER', 9, 'OWNER'))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});
