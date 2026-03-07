import { CProductModel } from '@/types/product/product.class';

describe('CProductModel', () => {
  it('creates a model and computes indianPrice', () => {
    const model = new CProductModel('p1', 'Keyboard', 10, 'Mech keyboard', true);

    expect(model.id).toBe('p1');
    expect(model.name).toBe('Keyboard');
    expect(model.price).toBe(10);
    expect(model.description).toBe('Mech keyboard');
    expect(model.inStock).toBe(true);
    expect(model.indianPrice).toBe(830);
  });
});
