function testSetup(){
    $.hr.init();

}

test("can initialize hashrouter", function() {
    $.hr.init();
    ok(true);
});

test("can change the url to specific key and value", function() {
    $.hr.init();
    $.hr.setUrl('page','index', true);
    equal(document.location.hash, '#!/page:index/');
    ok(true);
});

test("can change the url to an object of keys and values", function(){
    $.hr.init();
    $.hr.setUrl({'page':'page2', 'id':'4'}, true);
    equal(document.location.hash, '#!/page:page2/id:4/');
    ok(true);
});

asyncTest("called back for a value changing", function(){
    $.hr.init();
    $.hr.bind('a1', function(value){
        equal(value, '1');
        ok(true);
        start();
    });

    $.hr.setUrl({'a1':'1'}, true);
});

asyncTest("called back for multi values", function(){
    $.hr.init();
    $.hr.bind(['a2', 'a3'], function(values){
        equal(values.a2, 'aa');
        equal(values.a3, 'bb');
        ok(true);
        start();
    });

    $.hr.setUrl({'a2':'aa', 'a3':'bb'}, true);

});