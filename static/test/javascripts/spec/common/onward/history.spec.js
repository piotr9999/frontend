define([
    'common/modules/onward/history',
    'fixtures/history/contains',
    'fixtures/history/max',
], function(hist, contains, max) {

    var setStorageItem = function(key, data) {
        window.localStorage.setItem(key, JSON.stringify({
            'value' : data
        }));
    };

    var pageConfig = {
            pageId: "/p/3jbcb",

            section: "foobar",
            sectionName: "Foobar Section",

            keywordIds: "foo/bar,baz/poo",
            keywords: "Foobar Tag,Bazpoo Tag",

            seriesId: "foo/series/bar",
            series: "Foobar Series",

            authorIds: "profile/finbarrsaunders,profile/rogermellie",
            author: "Finbarr Saunders, Roger Mellie"
        },
        oftenVisited = {
            pageId: "123",
            section: "often/visited",
            sectionName: "Often Visited Section",
        },
        lessVisited = {
            pageId: "456",
            section: "less/visited",
            sectionName: "Less Visited Section",
        };

    describe('History', function() {

        beforeEach(function() {
            hist.reset();
            setStorageItem('gu.history', contains);
        });

        it('should get history from local storage', function() {
            expect(hist.getHistory()).toEqual(contains);
        });

        it('should set history to local storage', function() {
            hist.log(pageConfig);

            expect(hist.getHistory()[0][0]).toEqual(pageConfig.pageId);
        });

        it('should set the count of entries', function() {
            hist.log(pageConfig);
            expect(hist.getHistory()[0][1]).toEqual(1);

            hist.log(pageConfig);
            expect(hist.getHistory()[0][1]).toEqual(2);
        });

        it('should be able to check if an pageConfig id exists, and is a revisit', function() {
            hist.log(pageConfig);
            expect(hist.contains(pageConfig.pageId)).toBeTruthy();
            expect(hist.isRevisit(pageConfig.pageId)).toBeFalsy();

            hist.log(pageConfig);
            expect(hist.contains(pageConfig.pageId)).toBeTruthy();
            expect(hist.isRevisit(pageConfig.pageId)).toBeTruthy();
        });

        it('should only store 50 latest entries', function() {
            setStorageItem('gu.history', max);
            hist.log(pageConfig);

            expect(hist.getSize()).toEqual(50);
        });

        it('should increment a count in the summary, for the 1st value from each of various page metadata', function() {
            hist.log(pageConfig);

            expect(hist.test.getSummary().tags['foobar'][0]).toEqual('Foobar Section');
            expect(hist.test.getSummary().tags['foobar'][1][0][1]).toEqual(1);

            expect(hist.test.getSummary().tags['foo/bar'][0]).toEqual('Foobar Tag');
            expect(hist.test.getSummary().tags['foo/bar'][1][0][1]).toEqual(1);
            expect(hist.test.getSummary().tags['baz/poo']).toBeUndefined();

            expect(hist.test.getSummary().tags['foo/series/bar'][0]).toEqual('Foobar Series');
            expect(hist.test.getSummary().tags['foo/series/bar'][1][0][1]).toEqual(1);

            expect(hist.test.getSummary().tags['profile/finbarrsaunders'][0]).toEqual('Finbarr Saunders');
            expect(hist.test.getSummary().tags['profile/finbarrsaunders'][1][0][1]).toEqual(1);
            expect(hist.test.getSummary().tags['profile/rogermellie']).toBeUndefined();

            hist.log(pageConfig);
            hist.log(pageConfig);

            expect(hist.test.getSummary().tags['foobar'][0]).toEqual('Foobar Section');
            expect(hist.test.getSummary().tags['foobar'][1][0][1]).toEqual(3);
        });

        it('should age the data points in the the summary', function() {
            expect(
                hist.test.pruneSummary({
                    periodEnd: hist.test.today,
                    tags: {foo: ["Foo", [[0, 1]]]}
                })
                .tags['foo'][1][0][0]
            ).toEqual(0);

            expect(
                hist.test.pruneSummary({
                    periodEnd: hist.test.today - 5,
                    tags: {foo: ["Foo", [[0, 1]]]}
                })
                .tags['foo'][1][0][0]
            ).toEqual(5);
        });

        it('should drop the obsoleted data points from the summary', function() {
            expect(
                hist.test.pruneSummary({
                    periodEnd: hist.test.today - 500,
                    tags: {foo: ["Foo", [[0, 1]]]}
                })
                .tags['foo']
            ).toBeUndefined();
        });

        it('should return equally visited items in last-in-first-out order', function() {
            hist.log(oftenVisited);
            hist.log(lessVisited);

            expect(
                hist.getPopular()[0][0]
            ).toEqual('less/visited');

            expect(
                hist.getPopular()[1][0]
            ).toEqual('often/visited');
        });

        it('should return most visited items first', function() {
            hist.log(oftenVisited);
            hist.log(oftenVisited);
            hist.log(lessVisited);

            expect(
                hist.getPopular()[0][0]
            ).toEqual('often/visited');

            expect(
                hist.getPopular()[1][0]
            ).toEqual('less/visited');
        });
    });
});