import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'auth/dto';
import { EdituserDto } from 'user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'bookmark/dto';
describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();

    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });
  afterAll(() => {
    app.close();
  });
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'd@gmail.com',
      password: '123',
    };
    describe('Signup', () => {
      it('should throw error if no email is provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw error if no password is provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw error if no body is provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('should throw error if no email is provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw error if no password is provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw error if no body is provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('should get current user info', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('should edit user',()=>{
        const dto: EdituserDto = {
          firstName: 'Dav',
          email: 'da@gmail.com'
        }
        return pactum.spec().patch('/users').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).withBody(dto).expectStatus(200).expectBodyContains(dto.email).expectBodyContains(dto.firstName)
      })
    });
  });
  describe('Bookmarks', () => {
    describe('Get bookmarks', () => {
      it('should get bookmarks',()=>{
        return pactum.spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectBody([])
      })
    });

    describe('Create bookmark', () => {
      it('should create bookmark',()=>{
        const dto: CreateBookmarkDto = {
          title: 'firstBookmark',
          link: 'www.google.com'
        }
        return pactum.spec()
        .post('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).withBody(dto)
        .expectStatus(201)
        .stores('bookmarkId','id')
      })
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks',()=>{
        return pactum.spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectJsonLength(1)
      })
    });

    describe('Get bookmark by id', () => {
      it('should get bookmarks',()=>{
        return pactum.spec()
        .get('/bookmarks/{id}')
        .withPathParams('id','$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectBodyContains('$S{bookmarkId}')
      })
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        description: 'Lorem ipsum',
        title: 'Default title'
      }
      it('should edit bookmark', ()=>{
        return pactum.spec().patch('/bookmarks/{id}').withPathParams('id','$S{bookmarkId}').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.description)
        .expectBodyContains(dto.title)
        .expectBodyContains('$S{bookmarkId}')
      })
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark', ()=>{
        return pactum.spec()
        .delete('/bookmarks/{id}')
        .withPathParams('id','$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(204)
      })

      it('should get no bookmarks',()=>{
        return pactum.spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectJsonLength(0)
      })
    });
  });
});
