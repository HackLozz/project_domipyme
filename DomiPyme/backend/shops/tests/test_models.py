import pytest
from django.contrib.auth import get_user_model
from shops.models import Shop, Product

User = get_user_model()

@pytest.mark.django_db
def test_create_shop_and_product():
    user = User.objects.create_user(email='test@example.com', password='pass123')
    shop = Shop.objects.create(owner=user, name='Tienda 1', slug='tienda-1')
    product = Product.objects.create(shop=shop, name='Café', price=10000, stock=10)
    assert shop.products.count() == 1
    assert product.price == 10000
